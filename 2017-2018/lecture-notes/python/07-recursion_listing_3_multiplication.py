def multiplication(non_neg_integer_1, non_neg_integer_2):
    if non_neg_integer_2 == 0:
        return 0
    else:
        return non_neg_integer_1 + multiplication(non_neg_integer_1, non_neg_integer_2 - 1)


if __name__ == "__main__":
    n1 = 3
    n2 = 5
    print("Input numbers:", n1, n2)
    print("Result:", multiplication(n1, n2))
