from argparse import ArgumentParser
from requests import get
from os import sep, walk, path, makedirs
from logging import getLogger, INFO, StreamHandler, Formatter
from lxml import etree
from time import sleep
from random import randint
from csv import writer
import re


class PeerJDownloader(object):
    def __init__(self, base_url="https://peerj.com/articles/cs-", max_tentative=3, out_dir="."):
        self.base_url = base_url
        self.max_tentative = max_tentative
        self.out_dir = out_dir
        self.log = getLogger("PeerJ Downloader")
        self.log.setLevel(INFO)
        sh = StreamHandler()
        sh.setLevel(INFO)
        formatter = Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        sh.setFormatter(formatter)
        self.log.addHandler(sh)

    def get_downloaded_list(self):
        result = set()

        for cur_dir, cur_subdir, cur_files in walk(self.out_dir):
            for cur_file in cur_files:
                if cur_file.endswith(".xml"):
                    result.add(int(cur_file[:-4]))

        return result

    def download_peerj_sources(self):
        idx = 0
        count_404 = 0

        already_downloaded = self.get_downloaded_list()

        while count_404 < self.max_tentative:
            idx += 1
            if idx not in already_downloaded:
                sleep(randint(1, 3))
                self.log.info("Download document number %s" % str(idx))
                res = get(self.base_url + str(idx) + ".xml")
                if res.status_code == 200:
                    count_404 = 0

                    if not path.exists(self.out_dir):
                        makedirs(self.out_dir)

                    with open("%s%s%s.xml" % (self.out_dir, sep, str(idx)), "w") as f:
                        f.write(res.text)
                else:
                    self.log.warning("Document number %s does not exist" % str(idx))
                    count_404 += 1

    @staticmethod
    def n(s):
        return re.sub("\s+", " ", s).strip()


    def extract_from_downloaded(self):
        result = [("title", "authors", "doi", "abstract", "categories", "keywords", "journal",
                   "volume", "references", "figures", "tables", "year")]

        for cur_dir, cur_subdir, cur_files in walk(self.out_dir):
            for cur_file in cur_files:
                if cur_file.endswith(".xml"):
                    file_path = cur_dir + sep + cur_file
                    try:
                        xml = etree.parse(file_path)
                        self.log.info("Process file '%s'" % file_path)
                        title = "".join(xml.xpath("//front//article-meta//article-title//text()"))
                        authors = "; ".join(
                            ["%s, %s" % (self.n(author.xpath("./given-names")[0].text),
                                         self.n(author.xpath("./surname")[0].text))
                             for author in
                             xml.xpath("//front//article-meta//contrib-group[@content-type='authors']//name")])
                        doi = self.n(xml.xpath("//front//article-meta//article-id[@pub-id-type='doi']")[0].text)
                        abstract = self.n("".join(xml.xpath("//front//article-meta//abstract//p//text()")))
                        categories = "; ".join(
                            [self.n(category.text) for category in
                             xml.xpath("//front//article-meta//subj-group[@subj-group-type='categories']//subject")])
                        keywords = "; ".join(
                            [self.n(keyword.text) for keyword in
                             xml.xpath("//front//article-meta//kwd-group[@kwd-group-type='author']//kwd")])
                        journal = self.n(xml.xpath("//front//journal-meta//journal-title")[0].text)
                        volume = self.n(xml.xpath("//front//article-meta//volume")[0].text)
                        references = str(len(xml.xpath("//back//ref-list//ref")))
                        figures = str(len(xml.xpath("//body//fig")))
                        tables = str(len(xml.xpath("//body//table-wrap")))
                        year = self.n(xml.xpath("//front//article-meta//pub-date//year")[0].text)

                        result.append((title, authors, doi, abstract, categories, keywords, journal,
                                       volume, references, figures, tables, year))
                    except Exception:
                        self.log.warning("The file '%s' is not in XML" % file_path)

        return result


if __name__ == "__main__":
    arg_parser = ArgumentParser("storer.py")
    arg_parser.add_argument("-o", "--out_dir", dest="out_dir",
                            help="The directory where to store the XML files and the final CSV")
    arg_parser.add_argument("-b", "--base_url", dest="base_url",
                            help="The PeerJ base URL used for retrieving the XML sources")
    arg_parser.add_argument("-m", "--max", dest="max", type=int,
                            help="The max number of failure the script must have before to stop trying "
                                 "to download the sources")
    arg_parser.add_argument("-e", "--existing", dest="exist", action="store_true", default=False,
                            help="Process only the XML in the dir if they already exist")

    args = arg_parser.parse_args()

    base_url = "https://peerj.com/articles/cs-"
    if args.base_url is not None:
        base_url = args.base_url

    max_tentative = 3
    if args.max is not None:
        max_tentative = args.max

    out_dir = "."
    if args.out_dir is not None:
        out_dir = args.out_dir

    pj = PeerJDownloader(base_url, max_tentative, out_dir)

    if not args.exist:
        pj.download_peerj_sources()
    csv = pj.extract_from_downloaded()
    with open(out_dir + sep + "result.csv", "w") as f:
        csv_writer = writer(f)
        csv_writer.writerows(csv)