from typing import List
from models import Skill, Node, Tree
from schemas import SkillSchema, NodeSchema, TreeSchema

class SkillService:
    def get_skills(self) -> List[Skill]:
        # database query to retrieve skills
        return [Skill(id=1, name="Python", description="Programming language")]

    def create_skill(self, schema: SkillSchema):
        # database query to create a new skill
        pass

class NodeService:
    def get_nodes(self) -> List[Node]:
        # database query to retrieve nodes
        return [Node(id=1, skill_id=1, parent_id=None)]

    def create_node(self, schema: NodeSchema):
        # database query to create a new node
        pass

class TreeService:
    def get_trees(self) -> List[Tree]:
        # database query to retrieve trees
        return [Tree(id=1, name="Python", nodes=[Node(id=1, skill_id=1, parent_id=None)])]

    def create_tree(self, schema: TreeSchema):
        # database query to create a new tree
        pass