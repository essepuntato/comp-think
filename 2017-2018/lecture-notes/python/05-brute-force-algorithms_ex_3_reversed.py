from collections import deque


def reversed(input_list):
    result = list()

    # deque(<list>) implements the algorithm in '05-brute-force-algorithms_listing_2_stack_from_list.py'
    my_stack = deque(input_list)
    while len(my_stack) > 0:
        result.append(my_stack.pop())

    return result


if __name__ == "__main__":
    book_list = ["Coraline", "American Gods", "The Graveyard Book", "Good Omens", "Neverwhere"]
    print("Input list:", book_list)
    print("Result list:", reversed(book_list))
