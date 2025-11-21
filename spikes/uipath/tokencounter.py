import PyPDF2
import tiktoken
import os
import glob

def count_tokens_in_pdf(pdf_path, encoding_name="cl100k_base"):
    encoding = tiktoken.get_encoding(encoding_name)
    
    text = ""
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page in pdf_reader.pages:
            text += page.extract_text()
    
    tokens = encoding.encode(text)
    token_count = len(tokens)
    
    return token_count, text

if __name__ == "__main__":
    
    pdf_files = glob.glob("*.pdf")
    
    if not pdf_files:
        print("No PDF files found in the current directory.")
    else:
        for pdf_file in pdf_files:
            print(f"\nProcessing: {pdf_file}")
            token_count, text = count_tokens_in_pdf(pdf_file)
            print(f"Total tokens: {token_count}")
            print(f"Total characters: {len(text)}")