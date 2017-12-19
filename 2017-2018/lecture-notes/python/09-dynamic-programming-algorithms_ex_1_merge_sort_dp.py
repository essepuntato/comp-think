def merge_sort_dp(input_list, prev_l=list()):
    result = find_solution(input_list, prev_l)

    if result is None:
        if len(input_list) <= 1:
            result = store_solution(input_list, prev_l)
        else:
            input_list_len = len(input_list)
            mid = input_list_len // 2

            left = merge_sort_dp(input_list[0:mid], prev_l)
            right = merge_sort_dp(input_list[mid:input_list_len], prev_l)

            result = store_solution(merge(left, right), prev_l)
    print("\nPREV:", prev_l)
    return result


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


def find_solution(input_list, sol_list):
    input_dic = create_list_dict(input_list)
    for d, sol in sol_list:
        if input_dic == d:
            return list(sol)


def store_solution(input_list, sol_list):
    d = create_list_dict(input_list)
    sol_list.append((d, list(input_list)))
    return input_list


def create_list_dict(input_list):
    d = {}
    for el in input_list:
        if el not in d:
            d[el] = 0
        d[el] = d[el] + 1
    return d


if __name__ == "__main__":
    book_list = ["Coraline", "American Gods", "The Graveyard Book", "Good Omens", "Neverwhere", "American Gods",
                 "American Gods", "Good Omens", "The Graveyard Book", "American Gods", "Neverwhere", "Coraline"]
    print("Input list:", book_list)
    print("Result list:", merge_sort_dp(book_list))
