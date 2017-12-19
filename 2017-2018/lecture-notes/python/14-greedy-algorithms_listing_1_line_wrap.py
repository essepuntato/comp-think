def line_wrap(text, line_width):
    result = []
    space_left = line_width
    line = []

    for word in text.split(" "):
        word_len = len(word)

        if word_len + 1 <= space_left:
            line.append(word)
            space_left = space_left - word_len + 1
        else:
            result.append(" ".join(line))
            line = [word]
            space_left = line_width - word_len

    result.append(" ".join(line))

    return "\n".join(result)


if __name__ == "__main__":
    text = "This is just a text to understand how much the particular solution for creating line wrap is working."
    print("Input text:", text)
    result = line_wrap(text, 20)
    print("\nResult:")
    print(result)
