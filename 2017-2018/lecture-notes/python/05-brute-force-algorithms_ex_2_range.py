def range(input_number):
    result = []
    pos = 0
    while pos < input_number:
        result.append(pos)
        pos = pos + 1

    return result


if __name__ == "__main__":
    n = 10
    print("Input number:", n)
    print("Result list:", range(n))
