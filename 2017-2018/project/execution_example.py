# import the class 'ScholarlySearchEngine' from the local file 'sse.py'
from sse import ScholarlySearchEngine

# create a new object of the class 'ScholarlySearchEngine' specifying the input CSV file to process
my_sse = ScholarlySearchEngine("data_sample.csv")

# run a first search with a string comparison on the column 'title'
partial_result_1 = my_sse.search("machine or linked data", "title", False)
# print on screen the results returned by the 'pretty_print' method
print(my_sse.pretty_print(partial_result_1))

# run a second search using the partial result obtained previously
# with a number comparison on the column 'references'
partial_result_2 = my_sse.search("> 60", "references", True, partial_result_1)
# print on screen the filtered results returned by the 'pretty_print' method
print(my_sse.pretty_print(partial_result_2))

# retrieve the tree of publications of the author 'Bahar, Sateli', and print it on screen
print(my_sse.publication_tree("Bahar, Sateli"))

# retrieve the top ten authors (the ones that have published the most), and print it on screen
print(my_sse.top_ten_authors())

# retrieve the coauthor network of Tim Clark, and print it on screen
print(my_sse.coauthor_network("Tim, Clark"))
