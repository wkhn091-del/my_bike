"""Render a cinematic bike-charge hero as a PNG sequence.

The bike charges straight at the camera through the tunnel, then skids to a stop.

Usage (Blender 5.2):
  blender --background --python scripts/render-hero-video.py -- OUTPUT_DIR WIDTH HEIGHT [POSTER]
"""

from __future__ import annotations

import math
import random
import shutil
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
BIKE = Path(r"C:\Users\user\Downloads\mountain_bike_gt_avalanche_2.0.glb")
ROAD = Path(r"C:\Users\user\Downloads\american_road_through_tunnel.glb")


def args():
    values = sys.argv[sys.argv.index("--") + 1 :]
    return (
        Path(values[0]).resolve(),
        int(values[1]),
        int(values[2]),
        Path(values[3]).resolve() if len(values) > 3 else None,
    )


def imported_objects(path: Path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    return [item for item in bpy.data.objects if item not in before]


def mesh_objects(objects):
    return [item for item in objects if item.type == "MESH"]


def world_bounds(objects):
    corners = []
    for item in objects:
        if item.type != "MESH":
            continue
        corners.extend(item.matrix_world @ Vector(corner) for corner in item.bound_box)
    minimum = Vector((min(v.x for v in corners), min(v.y for v in corners), min(v.z for v in corners)))
    maximum = Vector((max(v.x for v in corners), max(v.y for v in corners), max(v.z for v in corners)))
    return minimum, maximum


def look_at(item, point):
    item.rotation_euler = (Vector(point) - item.location).to_track_quat("-Z", "Y").to_euler()


def keyframe(item, frame, location, rotation_euler):
    item.location = Vector(location)
    item.rotation_euler = Euler(rotation_euler, "XYZ")
    item.keyframe_insert("location", frame=frame)
    item.keyframe_insert("rotation_euler", frame=frame)


def make_parent(name, objects, target_length_along_y=None, target_width_along_x=None):
    """Normalize imported glTF (already Z-up in Blender) and park tires on Z=0."""
    parent = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(parent)
    for item in objects:
        if item.parent is None:
            item.parent = parent

    bpy.context.view_layer.update()
    minimum, maximum = world_bounds(objects)
    size = maximum - minimum
    if target_width_along_x:
        scale = target_width_along_x / max(size.x, 0.001)
    else:
        scale = target_length_along_y / max(size.y, 0.001)

    center = (minimum + maximum) * 0.5
    parent.scale = (scale, scale, scale)
    parent.location = (-center.x * scale, -center.y * scale, -minimum.z * scale)
    bpy.context.view_layer.update()
    return parent


def strip_bike_ground(objects):
    """Drop the flat scan plate that ships with the bike, keep every real bike mesh."""
    meshes = mesh_objects(objects)
    if not meshes:
        return objects

    def is_flat_plate(item):
        corners = [item.matrix_world @ Vector(corner) for corner in item.bound_box]
        xs = [c.x for c in corners]
        ys = [c.y for c in corners]
        zs = [c.z for c in corners]
        width = max(xs) - min(xs)
        depth = max(ys) - min(ys)
        height = max(zs) - min(zs)
        footprint = max(width, depth)
        return footprint > 0.01 and height < footprint * 0.08

    discarded = [item for item in meshes if is_flat_plate(item)]
    # Fallback: if nothing looked flat, drop the largest-footprint mesh with fewest verts density.
    if not discarded and len(meshes) > 1:
        discarded = [min(meshes, key=lambda item: len(item.data.vertices) / max(sum(item.dimensions), 0.001))]

    keep = []
    for item in list(objects):
        if item in discarded:
            bpy.data.objects.remove(item, do_unlink=True)
        else:
            keep.append(item)
    return keep


def add_dust():
    random.seed(17)
    material = bpy.data.materials.new("Warm skid dust")
    material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (0.78, 0.66, 0.48, 1)
    principled.inputs["Roughness"].default_value = 1
    try:
        principled.inputs["Alpha"].default_value = 0.55
    except KeyError:
        pass

    for index in range(40):
        x = (random.random() - 0.5) * 1.6
        y = -0.2 + (random.random() - 0.5) * 0.8
        z = 0.08 + random.random() * 0.35
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.04, location=(x, y, z))
        particle = bpy.context.object
        particle.name = f"Dust {index:02d}"
        particle.data.materials.append(material)
        particle.scale = (0, 0, 0)
        particle.keyframe_insert("scale", frame=42)
        size = 0.7 + random.random() * 1.6
        particle.scale = (size * 1.7, size, size * 0.8)
        particle.location += Vector((x * 0.4, y * 0.35, random.random() * 0.35))
        particle.keyframe_insert("scale", frame=48)
        particle.keyframe_insert("location", frame=48)
        particle.scale = (0, 0, 0)
        particle.location += Vector((x * 0.5, y * 0.4, 0.4 + random.random() * 0.35))
        particle.keyframe_insert("scale", frame=68)
        particle.keyframe_insert("location", frame=68)


def build_scene(width, height):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.fps = 24
    scene.frame_start = 1
    scene.frame_end = 72
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False

    scene.world = bpy.data.worlds.new("Hero world")
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.012, 0.016, 0.014, 1)
    background.inputs["Strength"].default_value = 0.35

    # Road: stretch along Blender Y (depth), keep asphalt near Z=0.
    road_objects = imported_objects(ROAD)
    road = make_parent("Road tunnel", road_objects, target_width_along_x=12)
    road.location.y += 4.0

    # Bike: drop scanned ground plate, size for a hero close-up, face +Y (toward camera).
    bike_objects = strip_bike_ground(imported_objects(BIKE))
    bike_model = make_parent("Bike model", bike_objects, target_width_along_x=2.8)
    # After glTF import the bike usually faces +X; rotate to charge toward the camera (+Y).
    bike_model.rotation_euler.z = math.pi / 2
    bpy.context.view_layer.update()

    rig = bpy.data.objects.new("Bike charge rig", None)
    scene.collection.objects.link(rig)
    bike_model.parent = rig
    bpy.context.view_layer.update()

    # Charge from deep tunnel (-Y) toward camera (+Y), then skid to a side pose.
    # Z is up; tires stay just above the asphalt.
    keyframe(rig, 1, (0.0, -18.0, 0.02), (0, 0, 0))
    keyframe(rig, 26, (0.05, -5.0, 0.02), (math.radians(2), 0, 0))
    keyframe(rig, 40, (0.1, 0.8, 0.03), (math.radians(4), 0, math.radians(-8)))
    # Dramatic skid: yaw ~80°, lean into the turn, bounce.
    keyframe(rig, 48, (0.45, 2.4, 0.08), (math.radians(8), math.radians(-12), math.radians(-82)))
    keyframe(rig, 54, (0.28, 2.05, 0.03), (math.radians(4), math.radians(-6), math.radians(-74)))
    keyframe(rig, 60, (0.32, 2.2, 0.02), (math.radians(3), math.radians(-5), math.radians(-78)))
    keyframe(rig, 72, (0.32, 2.2, 0.02), (math.radians(3), math.radians(-5), math.radians(-78)))

    camera_data = bpy.data.cameras.new("Hero camera")
    camera = bpy.data.objects.new("Hero camera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.data.lens = 35
    camera.location = (0.0, 7.2, 1.35)
    look_at(camera, (0.0, -2.0, 0.7))
    camera.keyframe_insert("location", frame=1)
    camera.keyframe_insert("rotation_euler", frame=1)

    camera.location = (0.05, 6.4, 1.2)
    look_at(camera, (0.1, 0.5, 0.55))
    camera.keyframe_insert("location", frame=40)
    camera.keyframe_insert("rotation_euler", frame=40)

    random.seed(91)
    base_location = camera.location.copy()
    base_rotation = camera.rotation_euler.copy()
    for frame in range(44, 56, 2):
        strength = 1 - abs(frame - 48) / 10
        camera.location = base_location + Vector(
            (
                (random.random() - 0.5) * 0.07 * strength,
                (random.random() - 0.5) * 0.05 * strength,
                (random.random() - 0.5) * 0.04 * strength,
            )
        )
        camera.rotation_euler = base_rotation.copy()
        camera.rotation_euler.z += (random.random() - 0.5) * 0.018 * strength
        camera.keyframe_insert("location", frame=frame)
        camera.keyframe_insert("rotation_euler", frame=frame)

    camera.location = (0.08, 6.55, 1.22)
    look_at(camera, (0.2, 1.4, 0.55))
    camera.keyframe_insert("location", frame=60)
    camera.keyframe_insert("rotation_euler", frame=60)
    camera.keyframe_insert("location", frame=72)
    camera.keyframe_insert("rotation_euler", frame=72)

    bpy.ops.object.light_add(type="AREA", location=(-4.0, 5.0, 6.5))
    key = bpy.context.object
    key.name = "Warm key"
    key.data.energy = 2200
    key.data.shape = "RECTANGLE"
    key.data.size = 9
    key.data.color = (1.0, 0.8, 0.55)
    look_at(key, (0, 1.0, 0.4))

    bpy.ops.object.light_add(type="AREA", location=(4.5, 1.0, 3.0))
    rim = bpy.context.object
    rim.name = "Cool rim"
    rim.data.energy = 1400
    rim.data.size = 5
    rim.data.color = (0.35, 0.55, 0.72)
    look_at(rim, (0, 1.5, 0.5))

    bpy.ops.object.light_add(type="SPOT", location=(0.0, 5.5, 3.2))
    spot = bpy.context.object
    spot.name = "Tunnel spot"
    spot.data.energy = 1400
    spot.data.spot_size = math.radians(60)
    spot.data.color = (1.0, 0.94, 0.82)
    look_at(spot, (0.2, 1.0, 0.3))

    add_dust()
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    return scene


def main():
    output, width, height, poster = args()
    output.mkdir(parents=True, exist_ok=True)
    scene = build_scene(width, height)
    scene.render.filepath = str(output / "frame_")
    bpy.ops.render.render(animation=True)
    if poster:
        poster.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(output / "frame_0001.png", poster)


if __name__ == "__main__":
    main()
