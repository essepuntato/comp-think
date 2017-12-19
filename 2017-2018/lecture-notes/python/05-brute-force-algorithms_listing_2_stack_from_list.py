from collections import deque


def stack_from_list(input_list):
    output_stack = deque()
    for item in input_list:
        output_stack.append(item)
    return output_stack


if __name__ == "__main__":
    number_list = [3, 4, 1, 2, 9, 8, 2]
    print("Input list:", number_list)
    print("Result stack:", stack_from_list(number_list))
