from app.api.identity_controller import fetch_live_azure_identities

if __name__ == "__main__":
    identities = fetch_live_azure_identities()
    print(f"Total Principals Extracted: {len(identities)}\n")
    for i in identities:
        print(f"{i['displayName']:<25} | Entra ID: {i['entraRole']:<35} | Sub IAM: {i['subscriptionRole']}")
