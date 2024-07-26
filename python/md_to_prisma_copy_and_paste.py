# this file takes a file path as an argument and copies the contents of the file to the clipboard
# except each newline is replace with a \\n so that you can copy and paste the contents into prisma studio

import sys
import pyperclip

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 md_to_prisma_copy_and_paste.py <file_path>")
        sys.exit(1)
    file_path = sys.argv[1]
    with open(file_path, 'r') as file:
        file_contents = file.read()
    file_contents = file_contents.replace('\n', 'NEWLINE')
    pyperclip.copy(file_contents)
    print("File contents copied to clipboard")

if __name__ == "__main__":
    main()