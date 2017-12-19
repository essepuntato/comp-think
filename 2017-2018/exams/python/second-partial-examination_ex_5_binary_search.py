def binary_search(item, ordered_list, start, end):
    if start <= end:
        mid = ((end - start) // 2) + start
        mid_item = ordered_list[mid]
        if item == mid_item:
            return mid
        elif mid_item < item:
            return binary_search(item, ordered_list, mid + 1, end)
        else:
            return binary_search(item, ordered_list, start, mid - 1)


if __name__ == "__main__":
    number_list = [0, 1, 6, 8, 11, 14, 16, 17, 18, 45]
    print("Input list:", number_list)
    print("Search for 0:", binary_search(0, number_list, 0, len(number_list) - 1))
    print("Search for 1:", binary_search(1, number_list, 0, len(number_list) - 1))
    print("Search for 7:", binary_search(7, number_list, 0, len(number_list) - 1))
    print("Search for 45:", binary_search(45, number_list, 0, len(number_list) - 1))

    book_list = ["American Gods", "Coraline", "Good Omens", "Neverwhere", "The Graveyard Book"]
    print("\nInput list:", book_list)
    print(binary_search("American Gods", book_list, 0, len(book_list) - 1))
    print(binary_search("Good Omens", book_list, 0, len(book_list) - 1))
    print(binary_search("The Sandman", book_list, 0, len(book_list) - 1))
    print(binary_search("The Graveyard Book", book_list, 0, len(book_list) - 1))