from anytree import Node
from itertools import product
from collections import deque


def solve(pegs, holes, end_position, last_move=Node("start"), no_win=list()):
    result = None

    if pegs not in no_win:
        no_win.append(set(pegs))

        if len(pegs) == 1 and end_position in pegs:
            result = last_move
        else:
            last_move.children = valid_moves(pegs, holes)
            possible_moves = deque(last_move.children)
            while result is None and len(possible_moves) > 0:
                current_move = possible_moves.pop()
                apply_move(current_move, pegs, holes)
                result = solve(pegs, holes, end_position, current_move, no_win)
                if result is None:
                    undo_move(current_move, pegs, holes)

    return result


def create_english_peg_board(full=[0, 1, 2, 3, 4, 5, 6], reduced=[2, 3, 4], final_position=(3, 3)):
    initial_hole = final_position
    holes = set()
    holes.add(initial_hole)

    pegs = set()
    pegs.update(product(full, reduced))
    pegs.update(product(reduced, full))
    pegs.remove(initial_hole)

    return pegs, holes, initial_hole


def create_square_solitaire(max_cells=6, final_position=(3, 2)):
    initial_hole = final_position
    holes = set()
    holes.add(initial_hole)

    pegs = set()
    cell = range(max_cells)
    pegs.update(product(cell, cell))
    pegs.remove(initial_hole)

    return pegs, holes, initial_hole


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
    pegs, holes, end_position = create_square_solitaire()
    print("Solution for the square peg solitaire:\n", solve(pegs, holes, end_position))

    pegs, holes, end_position = create_english_peg_board()
    print("Solution for the English peg solitaire:\n", solve(pegs, holes, end_position))
