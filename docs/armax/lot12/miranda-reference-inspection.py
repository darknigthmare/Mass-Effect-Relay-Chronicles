"""Inspect an archived XNALara model; outputs are reference renders, never masters.

No source geometry, UV or texture is edited. Format conventions were checked at
https://github.com/cochrane/GLLara/blob/main/Documentation/XNALara%20Model%20File%20Format.md
and https://github.com/johnzero7/XNALaraMesh/blob/master/import_xnalara_model.py .
Only diffuse textures are displayed. Community lightmaps, specular maps and all
normal maps are deliberately outside this material inspection.
"""
import bpy
import hashlib
import json
import math
import ntpath
from pathlib import Path
from mathutils import Vector

ROOT = Path('/workspace/scratch/133a501d40ef/references/lot12/costumes')
MODEL_DIR = ROOT / 'miranda-pack-crofty-originals/Miranda_Black_Suit_by_o0Crofty0o'
MODEL = MODEL_DIR / 'generic_item.mesh.ascii'
source_hashes = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in MODEL_DIR.iterdir() if p.is_file()}
lines = iter(MODEL.read_text().splitlines())

def line():
    return next(lines).split('#', 1)[0].strip()

def count():
    return int(line())

def values(kind=float):
    return [kind(t) for t in line().split()]

def basis(v):
    # Rigid axis convention only: XNA y-up -> Blender z-up.
    return (v[0], -v[2], v[1])

bone_count = count()
for _ in range(bone_count):
    line(); line(); line()
mesh_count = count()
records = []
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for part in range(mesh_count):
    name = line()
    uv_layers = count()
    textures = [(ntpath.basename(line()), count()) for _ in range(count())]
    positions, normals, uvdata = [], [], []
    vertex_count = count()
    for _ in range(vertex_count):
        positions.append(basis(values()))
        normals.append(basis(values()))
        values(int)  # Native vertex colors are recorded but not used as new paint.
        uvdata.append([values() for _ in range(uv_layers)])
        if bone_count:
            values(int); values()  # Keep the source rest pose; no bone transform.
    face_count = count()
    triangles = []
    for _ in range(face_count):
        a, b, c = values(int)
        triangles.append((a, c, b))  # XNA/Blender winding convention.
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(positions, [], triangles)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    mesh.normals_split_custom_set_from_vertices(normals)
    for layer in range(uv_layers):
        uv = mesh.uv_layers.new(name=f'NativeUV{layer}')
        for loop in mesh.loops:
            u, v = uvdata[loop.vertex_index][layer]
            uv.data[loop.index].uv = (u, 1.0 - v)  # Coordinate convention, no layout edit.
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    material = bpy.data.materials.new(name + '_diffuse_inspection')
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new('ShaderNodeOutputMaterial')
    shader = nodes.new('ShaderNodeBsdfDiffuse')
    image = nodes.new('ShaderNodeTexImage')
    image.image = bpy.data.images.load(str(MODEL_DIR / textures[0][0]), check_existing=True)
    material.node_tree.links.new(image.outputs['Color'], shader.inputs['Color'])
    material.node_tree.links.new(shader.outputs[0], output.inputs['Surface'])
    # The supplied diffuse channels stay unmodified. No supplemental alpha is invented.
    mesh.materials.append(material)
    assert len(mesh.vertices) == vertex_count and len(mesh.polygons) == face_count
    records.append({'mesh': name, 'vertices': vertex_count, 'triangles': face_count,
                    'diffuse': textures[0][0], 'diffuseSha256': source_hashes[textures[0][0]],
                    'ignoredTextureSlots': [t[0] for t in textures[1:]],
                    'uvLayers': uv_layers})
assert not list(lines)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 24
scene.cycles.use_denoising = False
scene.render.threads_mode = 'FIXED'
scene.render.threads = 4
scene.render.resolution_x = 1200
scene.render.resolution_y = 1400
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = False
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1
world = bpy.data.worlds.new('InspectionGrey')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (0.22, 0.22, 0.22, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = 0.65
target = Vector((-0.005, 0, 0.34))
light_definitions = [((-3, -4, 5), 180, 4), ((4, -2, 2), 110, 4), ((0, 4, 3), 150, 4)]
for index, (location, energy, size) in enumerate(light_definitions):
    data = bpy.data.lights.new(f'InspectionArea{index}', 'AREA')
    data.energy, data.size = energy, size
    obj = bpy.data.objects.new(data.name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (target - obj.location).to_track_quat('-Z', 'Y').to_euler()
camera_data = bpy.data.cameras.new('InspectionCamera')
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 2.5
camera = bpy.data.objects.new('InspectionCamera', camera_data)
bpy.context.collection.objects.link(camera)
scene.camera = camera
views = {'front': (0, -6, 0.34), 'three-quarter': (3, -6, 0.55), 'back': (0, 6, 0.34)}
outputs = []
for label, position in views.items():
    camera.location = position
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    path = ROOT / f'miranda-loyalty-diffuse-native-{label}.png'
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    outputs.append({'view': label, 'filename': path.name, 'camera': list(position),
                    'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
assert source_hashes == {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in MODEL_DIR.iterdir() if p.is_file()}
metadata = {'purpose': 'reference inspection only; never an imagegen master',
            'blender': bpy.app.version_string, 'source': str(MODEL.relative_to(ROOT)),
            'sourceSha256': source_hashes[MODEL.name], 'sourceFilesUnchanged': True,
            'sourceBoneCount': bone_count, 'meshes': records,
            'vertices': sum(x['vertices'] for x in records),
            'triangles': sum(x['triangles'] for x in records),
            'originalRestPose': True, 'geometryOrUvLayoutEdited': False,
            'coordinateConvention': 'position/normal (x,-z,y), winding (a,c,b), UV (u,1-v)',
            'diffuseOnly': True, 'normalSpecularLightmapsApplied': False,
            'render': {'engine': 'Cycles CPU', 'threads': 4, 'samples': 24, 'denoising': False,
                       'resolution': [1200, 1400], 'orthoScale': 2.5, 'viewTransform': 'Standard',
                       'look': 'None', 'worldGrey': 0.22, 'worldStrength': 0.65,
                       'areaLights': light_definitions, 'cameraTarget': list(target)},
            'limits': ['Source is an attributed community extraction/conversion, not certified against game files.',
                       'Community specular/AO/normal maps excluded; game material appearance is not certified.',
                       'No supplemental hair/eye transparency mask, vertex paint or bone pose was introduced.'],
            'outputs': outputs}
(ROOT / 'miranda-native-inspection-metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps({'complete': True, 'outputs': outputs}))
