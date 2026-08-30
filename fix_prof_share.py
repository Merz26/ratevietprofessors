import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# For professor, we might want to put the share button next to "So sánh" 
# Since align is justify, adding a 3rd button or 4th button could break the layout.
# Let's wrap the left buttons in a div or something, or change align to 'start' and add flex wrapper around it.
# Wait, let's see what buttons there are exactly.
