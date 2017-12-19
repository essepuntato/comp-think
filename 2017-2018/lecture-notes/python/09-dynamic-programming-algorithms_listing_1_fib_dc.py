def fib_dc(n):
    if n == 0 or n == 1:
        return n
    else:
        return fib_dc(n-1) + fib_dc(n-2)


if __name__ == "__main__":
    n = 35
    print("Input number:", n)
    print("Result list:", fib_dc(n))