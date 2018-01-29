def m_cypher(list_of_chars, list_of_matriculation_numbers):
    alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
                "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]

    list_of_numbers = []
    for number in list_of_matriculation_numbers:
        if number not in list_of_numbers:
            list_of_numbers.append(number)
    print(list_of_numbers)

    result = []
    a_len = len(alphabet)
    n_len = len(list_of_numbers)
    a_index = 0
    n_index = -1

    for char in list_of_chars:
        if char in alphabet:
            n_index = n_index + 1
            if n_index == n_len:
                n_index = 0

            a_index = a_index + list_of_numbers[n_index]
            if a_index >= a_len:
                a_index = a_index - a_len

            new_char = alphabet[a_index]
            result.append(new_char)
        else:
            result.append(char)

    return result


if __name__ == "__main__":
    my_list_of_char = list("i am ugo")
    my_list_of_number = [int(x) for x in "0000853757"]
    print(my_list_of_number)
    print(m_cypher(my_list_of_char, my_list_of_number))