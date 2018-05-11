def resolve(email, group_name):
    l = list()

    for idx in reversed(range(len(email))):
        l.append(email[idx])

    d = dict()
    for c in group_name:
        add(d, c)

    r = ""
    for i in l:
        if i not in d or not remove(d, i):
            r = r + i

    return r


def add(d, i):
    if i not in d:
        d[i] = 0
    d[i] = d[i] + 1


def remove(d, i):
    if i in d and d[i] > 0:
        d[i] = d[i] - 1
        return True

    return False


if __name__ == "__main__":
    print(resolve("silvio.peroni@unibo.it", "f4++"))
    print(resolve("silvio.peroni@unibo.it", "fantastic_four"))