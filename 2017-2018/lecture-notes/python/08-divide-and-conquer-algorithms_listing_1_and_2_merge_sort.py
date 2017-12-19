# Listing 1: merge
def merge(left, right):
    result = list()

    while len(left) > 0 and len(right) > 0:
        left_item = left[0]
        right_item = right[0]

        if left_item < right_item:
            result.append(left_item)
            left.remove(left_item)
        else:
            result.append(right_item)
            right.remove(right_item)

    result.extend(left)
    result.extend(right)

    return result


# Listing 2: merge_sort
def merge_sort(input_list):
    if len(input_list) <= 1:
        return input_list
    else:
        input_list_len = len(input_list)
        mid = input_list_len // 2

        left = merge_sort(input_list[0:mid])
        right = merge_sort(input_list[mid:input_list_len])

        return merge(left, right)


if __name__ == "__main__":
    number_list = [3, 4, 1, 2, 9, 8, 2]
    print("Input list:", number_list)
    print("Result list:", merge_sort(number_list))

    book_list = ["Coraline", "American Gods", "The Graveyard Book", "Good Omens", "Neverwhere"]
    print("\nInput list:", book_list)
    print("Result list:", merge_sort(book_list))