def contains_word(first_word, second_word, bibliographic_entry):
    contains_first_word = first_word in bibliographic_entry
    contains_second_word = second_word in bibliographic_entry

    if contains_first_word and contains_second_word:
        return 2
    elif contains_first_word or contains_second_word:
        return 1
    else:
        return 0


if __name__ == "__main__":
    bibliographic_entry = "Peroni, S., Osborne, F., Di Iorio, A., Nuzzolese, A. G., Poggi, F., Vitali, F., " \
                          "Motta, E. (2017). Research Articles in Simplified HTML: a Web-first format for " \
                          "HTML-based scholarly articles. PeerJ Computer Science 3: e132. e2513. " \
                          "DOI: https://doi.org/10.7717/peerj-cs.132"
    print(contains_word("Peroni", "Osborne", bibliographic_entry))
    print(contains_word("Peroni", "Asprino", bibliographic_entry))
    print(contains_word("Reforgiato", "Osborne", bibliographic_entry))
    print(contains_word("Reforgiato", "Asprino", bibliographic_entry))
