def insertion_sort(input_list):
    result = list()
    for position, item in enumerate(input_list):
        insert_position = len(result)
        for prev_position in reversed(range(insert_position)):
            if item < result[prev_position]:
                insert_position = prev_position
        result.insert(insert_position, item)
        # print("%s inserted in %s, cur list: %s" % (item, insert_position, result))
    return result

if __name__ == "__main__":
    number_list = [3, 4, 1, 2, 9, 8, 2]
    print("Input list:", number_list)
    print("Result list:", insertion_sort(number_list))

    book_list = ["Coraline", "American Gods", "The Graveyard Book", "Good Omens", "Neverwhere"]
    print("\nInput list:", book_list)
    print("Result list:", insertion_sort(book_list))