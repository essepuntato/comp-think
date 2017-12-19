def linear_search(input_list, value_to_search):
    for index, item in enumerate(input_list):
        if item == value_to_search:
            return index


if __name__ == "__main__":
    number_list = [3, 4, 1, 2, 9, 8, 2]
    print(linear_search(number_list, 1))
    print(linear_search(number_list, 7))

    book_list = ["Coraline", "American Gods", "The Graveyard Book", "Good Omens", "Neverwhere"]
    print(linear_search(book_list, "Good Omens"))
    print(linear_search(book_list, "The Sandman"))