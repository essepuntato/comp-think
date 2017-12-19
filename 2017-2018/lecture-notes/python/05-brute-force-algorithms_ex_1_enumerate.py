def enumerate(input_list):
    result = list()
    pos = -1
    for item in input_list:
        pos = pos + 1
        result.append((pos, item))

    return result


if __name__ == "__main__":
    book_list = ["Coraline", "American Gods", "The Graveyard Book", "Good Omens", "Neverwhere"]
    print("Input list:", book_list)
    print("Result list:", enumerate(book_list))