def m_hamming_distance(s1, s2):
    if len(s1) < len(s2):
        return s1
    elif len(s1) > len(s2):
        return s2
    else:
        result = 0
        for i in range(len(s1)):
            if s1[i] != s2[i]:
                result = result + 1
        return result


if __name__ == "__main__":
    print(m_hamming_distance("Silvio", "Peroni"))
    print(m_hamming_distance("Silvio", "Silvia"))
    print(m_hamming_distance("Silvio", "Tiziana"))