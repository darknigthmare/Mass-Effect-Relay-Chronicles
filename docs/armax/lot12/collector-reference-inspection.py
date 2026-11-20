import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path('/workspace/scratch/133a501d40ef/references/lot12/costumes')
variant = sys.argv[sys.argv.index('--') + 1]
assert variant in ('Male', 'Female')
source = ROOT / 'collector-armor-modelsresource-originals' / 'Collector Armor' / ('Collector Armor (' + variant + ')') / ('Collector Armor (' + variant + ').obj')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.wm.obj_import(filepath=str(source), forward_axis='NEGATIVE_Z', up_axis='Y')
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
coords = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
bounds = [[min(v[i] for v in coords), max(v[i] for v in coords)] for i in range(3)]
center = Vector([(a+b)/2 for a,b in bounds])
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 32
scene.cycles.use_denoising = False
scene.render.resolution_x = 1000
scene.render.resolution_y = 1400
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = False
scene.world.color = (0.2, 0.2, 0.2)
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'Medium High Contrast' if 'Medium High Contrast' in [x.identifier for x in bpy.types.ColorManagedViewSettings.bl_rna.properties['look'].enum_items] else 'None'
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1

def aim(obj, target):
    obj.rotation_euler = (target-obj.location).to_track_quat('-Z', 'Y').to_euler()

lights=[]
for name, pos, energy, size in [
    ('Key', (3,-4,4), 500, 4),
    ('Fill', (-3,-2,2), 300, 4),
    ('Rear', (0,4,3), 400, 4),
]:
    data=bpy.data.lights.new(name, 'AREA');data.energy=energy;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=pos;aim(obj,center)
    lights.append({'name':name,'location':pos,'energy':energy,'size':size})
data=bpy.data.cameras.new('Inspection camera');data.type='ORTHO';data.ortho_scale=2.4
camera=bpy.data.objects.new('Inspection camera',data);scene.collection.objects.link(camera);scene.camera=camera
views=[]
for name,pos in [('front',(0,-5,center.z)),('three-quarter',(3,-5,center.z+0.25)),('back',(0,5,center.z))]:
    camera.location=pos;aim(camera,center)
    out=ROOT/('collector-'+variant.lower()+'-native-'+name+'.png')
    scene.render.filepath=str(out)
    bpy.ops.render.render(write_still=True)
    views.append({'name':name,'path':str(out),'cameraLocation':list(pos),'cameraTarget':list(center)})
textures=[]
for material in bpy.data.materials:
    if material.use_nodes:
        textures.extend({'material':material.name,'image':node.image.filepath} for node in material.node_tree.nodes if node.type=='TEX_IMAGE' and node.image)
report={'purpose':'Temporary third-party source-model inspection, not generated master or repository artifact','source':str(source),'blenderVersion':bpy.app.version_string,'meshGeometryModified':False,'uvModified':False,'nativeDiffuseTexturesUsed':True,'normalAndSpecMapsApplied':False,'materials':'Original MTL imported by Blender OBJ importer; no texture edits','boundsAfterImport':bounds,'meshObjects':[{'name':o.name,'vertices':len(o.data.vertices),'polygons':len(o.data.polygons)} for o in meshes],'render':{'engine':'CYCLES','device':'CPU','samples':32,'denoising':False,'resolution':[1000,1400],'viewTransform':scene.view_settings.view_transform,'look':scene.view_settings.look,'orthographicScale':data.ortho_scale,'worldColor':[0.2,0.2,0.2]},'lights':lights,'textures':textures,'views':views}
(ROOT/('collector-'+variant.lower()+'-native-render-metadata.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
