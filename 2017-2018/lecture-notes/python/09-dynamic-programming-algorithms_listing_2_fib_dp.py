def fib_dp(n, input_dict=dict()):
    if n not in input_dict:
        if n == 0 or n == 1:
            input_dict[n] = n
        else:
            input_dict[n] = fib_dp(n-1, input_dict) + fib_dp(n-2, input_dict)

    return input_dict[n]


if __name__ == "__main__":
    n = 35
    print("Input number:", n)
    print("Result list:", fib_dp(n))
