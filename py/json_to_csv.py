import json
import csv
import re
import os

def clean_username(name):
    """Removes team prefixes and uppercases the text."""
    cleaned = re.sub(r'^(UIC|CYS|RD|EPS|HGG)\s+', '', name, flags=re.IGNORECASE)
    return cleaned.upper().strip()

def export_to_csv():
    # Input file is now located in the data folder
    input_file = os.path.join('data', 'teams.json')
    
    # Output file remains in the data folder
    output_dir = 'data'
    output_file = os.path.join(output_dir, 'players.csv')

    # Ensure the data/ folder exists (just in case)
    os.makedirs(output_dir, exist_ok=True)

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Exact headers from your LHM example file
    headers = ["Username", "SteamID", "First Name", "Last Name", "Country Code", "Team Name"]

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)

        first_team = True

        for team_key, team_info in data.items():
            t_display = team_info.get("teamDisplay", "")
            roster = team_info.get("roster", [])
            
            # Add an empty row between teams
            if not first_team:
                writer.writerow(["", "", "", "", "", ""])
            first_team = False

            for player in roster:
                g_name = player.get("gameName", "")
                t_line = player.get("tagLine", "")
                
                riot_id = f"{g_name}#{t_line}" if t_line and g_name else g_name
                
                # Skip the broken/empty players
                if not g_name and not t_line and not player.get("puuid"):
                    continue

                username = clean_username(g_name)

                writer.writerow([
                    username,  # Username
                    riot_id,   # SteamID (Holds the Riot ID)
                    "",        # First Name (Empty)
                    "",        # Last Name (Empty)
                    "DE",      # Country Code
                    t_display  # Team Name
                ])

if __name__ == "__main__":
    export_to_csv()
