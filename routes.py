from fastapi import FastAPI, Depends
from services import SkillService, NodeService, TreeService

app = FastAPI()

skill_service = SkillService()
node_service = NodeService()
tree_service = TreeService()

@app.get("/skills/")
def read_skills():
    return skill_service.get_skills()

@app.post("/skills/")
def create_skill(schema: SkillSchema):
    return skill_service.create_skill(schema)

@app.get("/nodes/")
def read_nodes():
    return node_service.get_nodes()

@app.post("/nodes/")
def create_node(schema: NodeSchema):
    return node_service.create_node(schema)

@app.get("/trees/")
def read_trees():
    return tree_service.get_trees()

@app.post("/trees/")
def create_tree(schema: TreeSchema):
    return tree_service.create_tree(schema)