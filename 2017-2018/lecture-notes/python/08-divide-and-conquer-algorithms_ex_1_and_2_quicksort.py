# Ex. 1
def partition(input_list, start, end, pivot_position):
    pivot = input_list[pivot_position]

    indexes = list(range(start, end + 1))
    indexes.remove(pivot_position)

    i = indexes[0]
    for index in indexes:
        if input_list[index] < pivot:
            swap(input_list, index, i)
            i = next_position(i, pivot_position)

    if pivot_position > i:
        new_pivot_position = i
    else:
        new_pivot_position = i - 1

    swap(input_list, pivot_position, new_pivot_position)
    return new_pivot_position


# Ex. 2
def swap(input_list, old_index, new_index):
    cur_value = input_list[old_index]
    input_list[old_index] = input_list[new_index]
    input_list[new_index] = cur_value


def next_position(position, pivot_position):
    result = position + 1
    if result == pivot_position:
        result = result + 1
    return result


def quicksort(input_list, start, end):
    if start < end:
        mid = partition(input_list, start, end, start)
        quicksort(input_list, start, mid - 1)
        quicksort(input_list, mid + 1, end)


if __name__ == "__main__":
    number_list = [3, 4, 1, 2, 9, 8, 2]
    print("Input list:", number_list)
    quicksort(number_list, 0, len(number_list) - 1)
    print("Result list:", number_list)

    book_list = ["Coraline", "American Gods", "The Graveyard Book", "Good Omens", "Neverwhere"]
    print("\nInput list:", book_list)
    quicksort(book_list, 0, len(book_list) - 1)
    print("Result list:", book_list)