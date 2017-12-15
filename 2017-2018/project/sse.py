# The following importing line is used to include in the definition of this class
# the particular functions implemented by a group. The 'my_test_group' module specified
# here is just a placeholder, since it defines only the signature of the various
# functions but it returns always None.
from my_test_group import *


# This is the class implementing the scholarly search engine. It includes six
# methods: the constructor (__init__), search, pretty_print, publication_tree,
# top_ten_authors, and coauthor_network.
class ScholarlySearchEngine():
    def __init__(self, source_csv_file_path):
        self.data = process_data(source_csv_file_path)

    def search(self, query, col, is_number, partial_res=None):
        result_data = do_search(self.data, query, col, is_number, partial_res)

        return result_data

    def pretty_print(self, result_data):
        list_of_strings = do_pretty_print(self.data, result_data)

        return list_of_strings

    def publication_tree(self, author):
        pub_tree = do_publication_tree(self.data, author)

        return pub_tree

    def top_ten_authors(self):
        list_of_tuples = do_top_ten_authors(self.data)

        return list_of_tuples

    def coauthor_network(self, author):
        coauth_graph = do_coauthor_network(self.data, author)

        return coauth_graph
    