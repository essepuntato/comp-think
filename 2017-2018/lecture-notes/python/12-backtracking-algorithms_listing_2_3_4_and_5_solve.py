from anytree import Node
from itertools import product
from collections import deque


def solve(pegs, holes, last_move=Node("start")):
    result = None

    if len(pegs) == 1 and (3, 3) in pegs:
        result = last_move
    else:
        last_move.children = valid_moves(pegs, holes)
        possible_moves = deque(last_move.children)

        while result == None and len(possible_moves) > 0:
            current_move = possible_moves.pop()
            apply_move(current_move, pegs, holes)
            result = solve(pegs, holes, current_move)
            if result == None:
                undo_move(current_move, pegs, holes)

    return result


def create_english_peg_board():
    initial_hole = (3, 3)
    holes = set()  # create the set of all the available holes
    holes.add(initial_hole)

    pegs = set()  # create the set of all the available pegs
    full = [0, 1, 2, 3, 4, 5, 6]
    reduced = [2, 3, 4]
    pegs.update(product(full, reduced))
    pegs.update(product(reduced, full))
    pegs.remove(initial_hole)

    return (pegs, holes)


def valid_moves(pegs, holes):
    result = list()

    for x, y in holes:
        if (x-1, y) in pegs and (x-2, y) in pegs:
            result.append(Node({"move": (x-2, y), "in": (x, y), "remove": (x-1, y)}))
        if (x+1, y) in pegs and (x+2, y) in pegs:
            result.append(Node({"move": (x+2, y), "in": (x, y), "remove": (x+1, y)}))
        if (x, y-1) in pegs and (x, y-2) in pegs:
            result.append(Node({"move": (x, y-2), "in": (x, y), "remove": (x, y-1)}))
        if (x, y+1) in pegs and (x, y+2) in pegs:
            result.append(Node({"move": (x, y+2), "in": (x, y), "remove": (x, y+1)}))

    return result


def apply_move(node, pegs, holes):
    move = node._name

    old_pos = move["move"]
    new_pos = move["in"]
    eat_pos = move["remove"]

    pegs.remove(old_pos)
    holes.add(old_pos)

    pegs.add(new_pos)
    holes.remove(new_pos)

    pegs.remove(eat_pos)
    holes.add(eat_pos)


def undo_move(node, pegs, holes):
    move = node._name

    old_pos = move["move"]
    new_pos = move["in"]
    eat_pos = move["remove"]

    pegs.add(old_pos)
    holes.remove(old_pos)

    pegs.remove(new_pos)
    holes.add(new_pos)

    pegs.add(eat_pos)
    holes.remove(eat_pos)


if __name__ == "__main__":
    pegs, holes = create_english_peg_board()
    print("Solution for the English peg solitaire:\n", solve(pegs, holes))
