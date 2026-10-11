from ingest import split_text, CHUNK_SIZE, CHUNK_OVERLAP

sample_text = """
Host: How do you improve retention?

Guest: First, identify where users stop returning.
Examine retention by cohort.

Guest: Next, investigate onboarding.
Find the steps users fail to complete.

Host: How do you measure the improvement?
""".strip()

chunks = split_text(sample_text)

print(f"Chunk size limit: {CHUNK_SIZE}")
print(f"Overlap setting: {CHUNK_OVERLAP}")
print(f"Number of chunks: {len(chunks)}")

for index, chunk in enumerate(chunks, start=1):
    print(f"\n--- Chunk {index} ({len(chunk)} characters) ---")
    print(chunk)