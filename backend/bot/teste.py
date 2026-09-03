import sqlite3

conn = sqlite3.connect("statssheets.db")

cursor = conn.cursor()

cursor.execute("SELECT * FROM teams;")

print(cursor.fetchall())

cursor.execute("SELECT * FROM players;")

print(cursor.fetchall())