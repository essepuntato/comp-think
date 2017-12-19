def exponentation(base_number, exponent):
    # watch out: 0^0 is defined as 1 (as indicated by Google Calculator)
    if exponent == 0:
        return 1
    else:
        return base_number * exponentation(base_number, exponent - 1)


if __name__ == "__main__":
    n_a_1 = 3
    n_a_2 = 4
    print("Input numbers:", n_a_1, n_a_2)
    print("Result:", exponentation(n_a_1, n_a_2))

    n_b_1 = 17
    n_b_2 = 1
    print("\nInput numbers:", n_b_1, n_b_2)
    print("Result:", exponentation(n_b_1, n_b_2))

    n_c_1 = 2
    n_c_2 = 0
    print("\nInput numbers:", n_c_1, n_c_2)
    print("Result:", exponentation(n_c_1, n_c_2))
