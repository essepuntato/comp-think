def w_count(s, text):
    result = {}

    c_values = {}
    for c in s.lower().replace(" ", ""):
        if c not in c_values:
            result[c] = 0
            c_values[c] = 0
        c_values[c] = (c_values[c] + 1) * 2

    for k in c_values:
        result[k] = calculate(k, c_values[k], text.split())

    return result


def calculate(key, value, token_list):
    l_len = len(token_list)
    if l_len == 0:
        return 0
    else:
        cur_token = token_list[0]

        if key in cur_token:
            result = value
        else:
            result = -1

        return result + calculate(key, value, token_list[1:l_len])


if __name__ == "__main__":
    my_text = "Begin at the beginning and go on till you come to the end: then stop."
    my_full_name = "Silvio Peroni"
    print(w_count(my_full_name, my_text))