def algorithm(dictionary, key_list):
    result = set()

    for key in key_list:
        if key in dictionary:
            result.add(dictionary[key])

    return result


if __name__ == "__main__":
    my_dict = dict({"a": 1, "b": 2, "c": 3})
    my_list = ["a", "c"]
    print(algorithm(my_dict, my_list))