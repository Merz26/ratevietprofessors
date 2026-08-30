import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace bg-white/40 dark:bg-black/40
content = content.replace('bg-white/40 dark:bg-black/40', 'bg-white/20 dark:bg-white/[0.02]')
content = content.replace('hover:bg-white/65 dark:hover:bg-black/65', 'hover:bg-white/40 dark:hover:bg-white/[0.06]')

# Replace bg-white/60 dark:bg-black/60
content = content.replace('bg-white/60 dark:bg-black/60', 'bg-white/30 dark:bg-white/[0.04]')

# Replace bg-white/50 dark:bg-black/50
content = content.replace('bg-white/50 dark:bg-black/50', 'bg-white/20 dark:bg-white/[0.03]')

# Replace bg-white/30 dark:bg-black/30
content = content.replace('bg-white/30 dark:bg-black/30', 'bg-white/10 dark:bg-white/[0.02]')

# Replace the dropdown menu
content = content.replace('bg-white/80 dark:bg-[#18181b]/90', 'bg-white/60 dark:bg-white/[0.08]')

# Also there's one with hover:bg-white/85 dark:hover:bg-white/[0.16] that we can tweak for the button
content = content.replace('bg-white/60 dark:bg-white/[0.08] backdrop-blur-sm', 'bg-white/20 dark:bg-white/[0.04] backdrop-blur-sm')

with open('src/App.tsx', 'w') as f:
    f.write(content)
