from dotenv import load_dotenv
import os
import traceback

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

class CollectionFallback:
	"""Wrapper that provides a subset of PyMongo collection API backed by TinyDB."""
	def __init__(self, table):
		self.table = table

	def insert_one(self, doc):
		# emulate pymongo insert_one
		self.table.insert(dict(doc))

	def find(self, query=None, projection=None):
		all_docs = self.table.all()
		if not query:
			return all_docs
		# very simple matching: check keys equal
		res = []
		for d in all_docs:
			match = True
			for k, v in query.items():
				if d.get(k) != v:
					match = False
					break
			if match:
				res.append(d)
		return res

	def find_one(self, query):
		res = self.find(query)
		return res[0] if res else None

	def update_one(self, query, update):
		doc = self.find_one(query)
		if not doc:
			return
		# support {$set: {...}}
		set_fields = update.get("$set", {})
		doc.update(set_fields)
		self.table.update(doc, self.table.test(lambda r: r.get('name') == doc.get('name')))

	def count_documents(self, query):
		return len(self.find(query))


def _init_db():
	# Try MongoDB first; fall back to TinyDB file storage if unavailable
	if MONGO_URI:
		try:
			from pymongo import MongoClient
			client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
			# force connection test
			client.server_info()
			db = client.get_database(os.getenv("MONGO_DB", "lostfound"))
			return db["users"], db["items"]
		except Exception:
			traceback.print_exc()
	# fallback to TinyDB
	try:
		from tinydb import TinyDB, where
		dbfile = os.path.join(os.path.dirname(__file__), 'data.json')
		tdb = TinyDB(dbfile)
		users_table = tdb.table('users')
		items_table = tdb.table('items')
		return CollectionFallback(users_table), CollectionFallback(items_table)
	except Exception:
		traceback.print_exc()
		raise


users, items = _init_db()
