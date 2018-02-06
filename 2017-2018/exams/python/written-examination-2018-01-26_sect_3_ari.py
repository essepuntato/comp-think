import re
import math


def ari(text):
    num_char = len(re.sub("[^A-z0-9]", "", text))
    num_word = len(text.split())
    num_sent = len(re.sub("[^\\.]", "", text))
    ari_value = (4.71 * (num_char / num_word)) + (0.5 * (num_word / num_sent)) - 21.43
    return math.ceil(ari_value)

if __name__ == "__main__":
    my_text = "Semantic Publishing involves the use of Web and Semantic Web technologies and standards for the " \
              "semantic enhancement of a scholarly work so as to improve its discoverability, interactivity, " \
              "openness and (re-)usability for both humans and machines. Recently, people have suggested that " \
              "the semantic enhancements of a scholarly work should be undertaken by the authors of that scholarly " \
              "work, and should be considered as integral parts of the contribution subjected to peer review. " \
              "However, this requires that the authors should spend additional time and effort adding such semantic " \
              "annotations, time that they usually do not have available. Thus, the most pragmatic way to " \
              "facilitate this additional task is to use automated services that create the semantic annotation " \
              "of authors' scholarly articles by parsing the content that they have already written, thus reducing " \
              "the additional time required of the authors to that for checking and validating these semantic " \
              "annotations. In this article, I propose a generic approach called compositional and iterative " \
              "semantic enhancement (CISE) that enables the automatic enhancement of scholarly papers with " \
              "additional semantic annotations in a way that is independent of the markup used for storing " \
              "scholarly articles and the natural language used for writing their content."
    print(ari(my_text))