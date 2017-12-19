from decimal import Decimal

def return_change(amount):
    result = {}
    coins = [2.0, 1.0, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01]

    for coin in coins:
        while float_diff(amount, coin) >= 0:
            amount = float_diff(amount, coin)

            if coin not in result:
                result[coin] = 0
            result[coin] = result[coin] + 1

    return result


def float_diff(f1, f2):
    return round(f1 - f2, 2)


if __name__ == "__main__":
    change = 2.76
    print("Change to return:", change)
    print("Result:\n", return_change(change))

