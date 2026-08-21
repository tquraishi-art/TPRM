"""
Sanitize index.html — replace all real company names, person names,
specific dollar amounts and sensitive business context with generic data.
Usage: python scripts/sanitize_data.py
Creates a backup at index.html.bak before writing.
"""
import re, shutil, os

SRC  = os.path.join(os.path.dirname(__file__), "..", "index.html")
BAK  = SRC + ".bak"

shutil.copy2(SRC, BAK)
print(f"Backup saved to {BAK}")

with open(SRC, encoding="utf-8") as f:
    html = f.read()

# ── PERSON NAMES ─────────────────────────────────────────────────────────────
PEOPLE = [
    # Sourcing leads / owners (longest/most specific first to avoid partial matches)
    ("Annamaria Cotroneo",    "Anna Romano"),
    ("Tracy Kilbane-Clune",   "Tracey Collins"),
    ("Tracey Kilbane-Clune",  "Tracey Collins"),
    ("Cheryl Silverthorne",   "Dana Chen"),
    ("Whitney Johnston",      "Casey Morgan"),
    ("Jacquelyn Galbreth",    "Jackie Grant"),
    ("Jacqueline Woo",        "Jackie Huang"),
    ("Kaitlyn Olsen",         "Taylor Nguyen"),
    ("Kaityln Olsen",         "Taylor Nguyen"),
    ("Cherise Brown",         "Alex Rivera"),
    ("Charles Pinckney",      "Drew Wilson"),
    ("Daisuke Fukaura",       "Hiroshi Tanaka"),
    ("Yuichi Imaide",         "Kenji Watanabe"),
    ("Denice Michel",         "Chris Patel"),
    ("Marisol Hard",          "Maria Santos"),
    ("Sarah Middaugh",        "Rachel Cooper"),
    ("Avik Sengupta",         "Raj Kumar"),
    ("Avik/Stanley",          "Raj/Stan"),
    ("Lindsay McGregor",      "Blair McDonald"),
    ("Kimberly Kieken",       "Kelly Pearson"),
    ("Kevin Hazzard",         "Pat Morrison"),
    ("Pauline Manuel",        "Paula Martin"),
    ("Aaron Maxson",          "Sam Holloway"),
    ("Brian Jacobsen",        "Ryan Andersen"),
    ("Ayako Kunimi",          "Yuki Nakamura"),
    ("Gregg Linder",          "Morgan Blake"),
    ("Craig Ferguson",        "Riley Parker"),
    ("Laura Rivera",          "Jamie Torres"),
    ("Margo Lothian",         "Fiona Campbell"),
    ("Paul Kristek",          "Mike Larson"),
    ("Paul Bennett",          "Quinn Foster"),
    ("Neil Nisbet",           "Sean Matthews"),
    ("David Sun",             "Michael Chen"),
    ("Federico Huergo",       "Felipe Herrera"),
    ("Katie Duong",           "Kim Davis"),
    ("Bella Karp",            "Bella Ross"),
    ("Todd Allen",            "Brett Hansen"),
    ("Dave Mordue",           "Shane Collins"),
    ("Syd Blake",             "Jordan Lee"),
    ("John Puma",             "Jake Porto"),
    ("Alps Shah",             "Dev Patel"),
    ("Kat Bernardo",          "Kit Fernandez"),
    ("Nate Bruce",            "Nick Brooks"),
    ("Tim Koch",              "Tom Koch"),
    ("Nour Abi Samra",        "Nora Samara"),
    ("Gerry Earnshaw",        "Gary Ellsworth"),
    ("Dongneon Kim",          "Daniel Kim"),
    ("Autumn Brown",          "Amanda Brown"),
    ("Aaron Fig",             "Alan Ford"),
    ("Ruth Ahmed",            "Rachel Ahmed"),
    ("Abby Francis",          "Amy Phillips"),
    ("Zach Baker",            "Zach Baker"),       # keep — generic enough
    ("April Selkow",          "April Selkow"),     # keep — generic enough
    ("Melissa Chin",          "Melissa Chan"),
    ("Stanley",               "Stan"),
    ("Bella Karp",            "Bella Ross"),
]

# ── COMPANY NAMES ─────────────────────────────────────────────────────────────
COMPANIES = [
    # Full legal names first, then trading names
    ("JONES LANG LASALLE INCORPORATED",           "MERIDIAN PROPERTY GROUP INC"),
    ("JONES LANG LASALLE AMERICAS INC",           "MERIDIAN PROPERTY GROUP AMERICAS INC"),
    ("JONES LANG LASALLE (JLL)",                  "Meridian Property Group"),
    ("Jones Lang LaSalle",                        "Meridian Property Group"),
    ("JLL Japan",                                 "Meridian Property Japan"),
    ("JLL (Jones Lang Lasalle)",                  "Meridian Property Group"),
    ("JLL (Integrated Facilities Management)",    "Meridian (Integrated Facilities)"),
    ("JLL (Lease Administration & Sub Tenant Management)", "Meridian (Lease Administration)"),
    ("JLL (Lease Administration & Sublease Management)",   "Meridian (Lease Administration)"),
    ("JLL (Lease Administration & Sublease Mgmt)","Meridian (Lease Administration)"),
    ("JLL",                                       "Meridian Property Group"),

    ("CUSHMAN AND WAKEFIELD US INC",              "PINNACLE WORKPLACE SOLUTIONS US INC"),
    ("CUSHMAN AND WAKEFIELD",                     "PINNACLE WORKPLACE SOLUTIONS"),
    ("Cushman & Wakefield",                       "Pinnacle Workplace Solutions"),
    ("Cushman and Wakefield",                     "Pinnacle Workplace Solutions"),

    ("CBRE Managed Services Limited (UK)",        "Atlas RE Managed Services UK"),
    ("CBRE INC",                                  "ATLAS REAL ESTATE PARTNERS INC"),
    ("CBRE GWS SAS (UK)",                         "Atlas RE Solutions UK"),
    ("CBRE",                                      "Atlas Real Estate Partners"),

    ("COMPUTACENTER AG AND CO OHG",               "TECHBRIDGE SOLUTIONS AG"),
    ("COMPUTACENTER PLC",                         "TECHBRIDGE SOLUTIONS PLC"),
    ("COMPUTACENTER",                             "TechBridge Solutions"),
    ("Computacenter",                             "TechBridge Solutions"),

    ("CISCO SYSTEMS INC",                         "NETCORE SYSTEMS INC"),
    ("Cisco Systems",                             "NetCore Systems"),
    ("Cisco",                                     "NetCore Systems"),

    ("WORLD WIDE TECHNOLOGY LLC",                 "GLOBALTECH DISTRIBUTION LLC"),
    ("World Wide Technology",                     "GlobalTech Distribution"),
    ("WWT",                                       "GlobalTech Distribution"),

    ("ACCENTURE LLP",                             "APEX CONSULTING GROUP LLP"),
    ("ACCENTURE",                                 "Apex Consulting Group"),
    ("Accenture",                                 "Apex Consulting Group"),

    ("COGNIZANT WORLDWIDE LIMITED",               "NEXUS TECHNOLOGY SERVICES LTD"),
    ("COGNIZANT TECHNOLOGY SOLUTIONS",            "Nexus Technology Solutions"),
    ("COGNIZANT",                                 "Nexus Technology Services"),
    ("Cognizant",                                 "Nexus Technology Services"),

    ("TECH MAHINDRA LTD",                         "PACIFIC TECH SERVICES LTD"),
    ("Tech Mahindra",                             "Pacific Tech Services"),

    ("NTT DATA AMERICAS INC",                     "SUMMIT DATA SOLUTIONS INC"),
    ("NTT Data",                                  "Summit Data Solutions"),

    ("ALTIMETRIK CORP",                           "DATASTREAM CONSULTING CORP"),
    ("ALTIMETRIK",                                "DataStream Consulting"),

    ("Digital Realty Trust LP",                   "CoreData Centers LP"),
    ("Digital Realty & Interxion",                "CoreData Centers"),
    ("Digital Realty",                            "CoreData Centers"),

    ("EQUINIX INC",                               "NEXUS COLOCATION INC"),
    ("Equinix",                                   "Nexus Colocation"),

    ("SINCH SWEDEN AB",                           "WAVELINE COMMUNICATIONS AB"),
    ("SINCH INTERCONNECT",                        "Waveline Interconnect"),
    ("Sinch Sweden",                              "Waveline Communications"),
    ("Sinch",                                     "Waveline Communications"),

    ("SINCH SWEDEN AB",                           "WAVELINE COMMUNICATIONS AB"),

    ("ABM INDUSTRY GROUPS LLC",                   "FACILITYFIRST SERVICES LLC"),
    ("ABM INDUSTRY GROUPS",                       "FacilityFirst Services"),
    ("ABM",                                       "FacilityFirst Services"),

    ("SodexoMagic LLC / The Good Eating Co.",     "NourishWell Services"),
    ("THE GOOD EATING COMPANY LLC",               "FRESHTABLE COMPANY LLC"),
    ("Sodexo/Good Eating Co",                     "NourishWell Services"),
    ("SodexoMagic LLC",                           "NourishWell Services"),
    ("SodexoMagic",                               "NourishWell Services"),
    ("The Good Eating Co.",                       "FreshTable Co"),

    ("ARAMARK",                                   "DINEWELL GROUP"),
    ("Aramark",                                   "DineWell Group"),

    ("BTS USA INC",                               "HORIZON LEARNING GROUP INC"),
    ("BTS USA Inc.",                              "Horizon Learning Group"),
    ("BTS USA",                                   "Horizon Learning Group"),

    ("AQUENT LLC",                                "CREATIVEFORCE STAFFING LLC"),
    ("Aquent",                                    "CreativeForce Staffing"),

    ("CREATIVES ON CALL INC",                     "PIXELBRIDGE CREATIVE INC"),
    ("Creatives on Call",                         "PixelBridge Creative"),

    ("HACKERONE INC",                             "SECURETEST INC"),
    ("HACKERONE",                                 "SecureTest"),
    ("HackerOne",                                 "SecureTest"),

    ("STEELCASE/ONE WORKPLACE L FERRARI LLC",     "WORKSPACE INTERIORS LLC"),
    ("STEELCASE/ONE WORKPLACE",                   "WorkSpace Interiors"),
    ("Steelcase/One Workplace",                   "WorkSpace Interiors"),
    ("One Workplace/Steelcase",                   "WorkSpace Interiors"),
    ("One Workplace L Ferrari LLC",               "WorkSpace Interiors"),
    ("Steelcase",                                 "WorkSpace Interiors"),

    ("MILLERKNOLL INC",                           "ERGODESIGN FURNITURE INC"),
    ("MillerKnoll (Formerly Herman Miller)",      "ErgoDesign Furniture"),
    ("MillerKnoll",                               "ErgoDesign Furniture"),
    ("Herman Miller",                             "ErgoDesign Furniture"),

    ("SANSI NORTH AMERICA LLC dba SNA",           "BRIGHTVIEW DISPLAY LLC"),
    ("SANSI NORTH AMERICA LLC",                   "BrightView Display LLC"),
    ("Sansi North America",                       "BrightView Display"),
    ("SANSI",                                     "BrightView Display"),

    ("TEECOM",                                    "TechIntegrate AV"),

    ("Stok LLC - 2",                              "GreenPath Consulting"),
    ("Stok LLC",                                  "GreenPath Consulting"),
    ("Stok",                                      "GreenPath Consulting"),

    ("VISIONS MANAGEMENT INTL CORP",              "MOVERIGHT LOGISTICS INTL CORP"),
    ("VISIONS MANAGEMENT",                        "MoveRight Logistics"),
    ("Visions Management",                        "MoveRight Logistics"),
    ("Visions",                                   "MoveRight Logistics"),
    ("VISIONS",                                   "MOVERIGHT LOGISTICS"),

    ("American Express",                          "GlobalPay Financial"),

    ("BANDWIDTH",                                 "CloudComm Networks"),
    ("Bandwidth",                                 "CloudComm Networks"),

    ("Incredible Management",                     "EventPro Management"),

    ("INFOSYS",                                   "INDIGO TECH SOLUTIONS"),
    ("Infosys",                                   "Indigo Tech Solutions"),

    ("Palo Alto Networks",                        "CyberShield Inc"),

    ("SPARKS EXHIBITS AND ENVIRONMENTS",          "SHOWFORCE EVENTS INC"),
    ("Sparks",                                    "ShowForce Events"),

    ("WEDRIVEU INC",                              "SHUTTLEPRO TRANSPORT INC"),
    ("WeDriveU",                                  "ShuttlePro Transport"),

    ("AIM SERVICES CO., LTD.",                    "Precision Facilities Asia"),
    ("AIM SERVICES",                              "Precision Facilities Asia"),

    ("GREEN WISE CO LTD",                         "ECOSPACE LTD"),
    ("Green Wise Co., Ltd.",                      "EcoSpace Ltd"),

    ("BIC SERVICES PTY LTD",                      "CLEANSPACE SERVICES PTY LTD"),
    ("BIC Services",                              "CleanSpace Services"),

    ("FOSSIX CORPORATE COFFEE PTY LIMITED",       "BREWPOINT COFFEE PTY LTD"),
    ("FOSSIX",                                    "BrewPoint Coffee"),

    ("HAMPR PTY LTD",                             "REFRESHTECH SERVICES PTY LTD"),
    ("HAMPR",                                     "RefreshTech Services"),

    ("ANTHESIS LLC",                              "VERDANT SUSTAINABILITY LLC"),
    ("Anthesis",                                  "Verdant Sustainability"),

    ("PAYROLL INC.",                              "PAYSTREAM INC."),
    ("Payroll Inc",                               "PayStream Inc"),

    ("COLLIERS INTERNATIONAL NSW PTY LTD",        "NEXUS PROPERTY ADVISORY PTY LTD"),
    ("Colliers",                                  "Nexus Property Advisory"),

    ("IWG",                                       "FlexSpace Group"),

    ("POWERSPEAKING INC",                         "CLEARVOICE TRAINING INC"),
    ("POWERSPEAKING",                             "ClearVoice Training"),
    ("Powerspeaking",                             "ClearVoice Training"),

    ("ARCHIMA LLC",                               "FEDSERV CONSULTING LLC"),
    ("Archima (Connexions Federal Services)",     "FedServ Consulting"),

    ("Openlogix",                                 "DataPath Solutions"),

    ("Oloop LLC",                                 "AgileWorks LLC"),
    ("Oloop",                                     "AgileWorks"),

    ("Streamlinevents",                           "EventStream Agency"),

    ("HAKUHODO INC",                              "HORIZON MEDIA AGENCY INC"),
    ("HAKUHODO",                                  "Horizon Media Agency"),

    ("Alison Regenold Executive Events (AREE)",   "Pinnacle Events Agency"),
    ("Alison Regenold Executive Events",          "Pinnacle Events Agency"),

    ("CyberAce Inc",                              "DigiAce Marketing Inc"),
    ("CyberAce",                                  "DigiAce Marketing"),

    ("DocuSign",                                  "SignFlow Technologies"),
    ("DATADOG",                                   "OBSERVEIT INC"),
    ("Datadog",                                   "ObserveIT Inc"),
    ("GitHub",                                    "CodeVault Platform"),
    ("JFROG INC",                                 "DEVFLOW TECHNOLOGIES INC"),
    ("JFrog",                                     "DevFlow Technologies"),

    ("Coupa",                                     "ProcureNet Software"),

    ("IBM",                                       "TechGiant Systems"),

    ("KPMG LLP",                                  "CORNERSTONE ASSURANCE LLP"),
    ("KPMG",                                      "Cornerstone Assurance"),

    ("PRICEWATERHOUSECOOPERS",                    "VANTAGE ADVISORY LLP"),
    ("PRICE WATERHOUSE AND CO LLP",               "VANTAGE ADVISORY LLP"),
    ("PricewaterhouseCoopers",                    "Vantage Advisory LLP"),
    ("PwC",                                       "Vantage Advisory"),
    ("PWC",                                       "Vantage Advisory"),

    ("Deloitte",                                  "Meridian Advisory"),
    ("DELOITTE",                                  "MERIDIAN ADVISORY"),

    ("Slalom",                                    "Clarity Consulting"),

    ("Crisis24",                                  "Sentinel Security"),
    ("CRISIS24 (Formerly GDBA)",                  "Sentinel Security"),
    ("GDBA",                                      "Sentinel Security"),
    ("GAVIN DE BECKER & ASSOCIATES",              "GUARDIAN SECURITY ASSOCIATES"),
    ("Gavin de Becker",                           "Guardian Security"),
    ("GDBA",                                      "Guardian Security"),

    ("SYCOMP A TECHNOLOGY COMPANY INC",           "TECHSERVE SOLUTIONS INC"),
    ("SYCOMP",                                    "TechServe Solutions"),

    ("Insight Enterprises",                       "Clearview Technology"),
    ("Insight Direct",                            "Clearview Technology"),
    ("INTERIOR ARCHITECTS INC",                   "DESIGNSPACE ARCHITECTS INC"),
    ("Interior Architects",                       "DesignSpace Architects"),

    ("KRYTERION INC",                             "PROCERT TESTING INC"),
    ("Kryterion",                                 "ProCert Testing"),

    ("ARUP US INC",                               "STRUCTUREWORKS ENGINEERING INC"),
    ("ARUP",                                      "StructureWorks Engineering"),
    ("Arup",                                      "StructureWorks Engineering"),

    ("MARK CAVAGNERO ASSOCIATES INC",             "CAVALLI DESIGN ASSOCIATES INC"),
    ("Mark Cavagnero Associates Inc.",            "Cavalli Design Associates"),
    ("Mark Cavagnero Associates (MCA)",           "Cavalli Design Associates"),
    ("Mark Cavagnero",                            "Cavalli Design"),

    ("Sensory Interactive",                       "MediaSense Interactive"),

    ("Alinea Consulting",                         "LinearPath Consulting"),
    ("ALINEA CONSULTING",                         "LINEARPATH CONSULTING"),

    ("REDDY PROJECT MANAGEMENT PTY LTD",          "APEX PROJECT MANAGEMENT PTY LTD"),
    ("Reddy PM",                                  "Apex Project Management"),

    ("Cyrusone",                                  "CoreSite Data Centers"),
    ("CYRUSONE",                                  "CORESITE DATA CENTERS"),

    ("Mitie Security Limited",                    "SecureGuard UK Limited"),

    ("Acacia Facilities Management",              "Pinnacle Facilities Management"),

    ("FLEXIM NETHERLANDS B V",                    "FLEXCLEAN EUROPE BV"),

    ("GCI INC",                                   "BUILDRIGHT CONTRACTORS INC"),

    ("KASA PARTNERS",                             "KEYSTONE RE PARTNERS"),

    ("TAPFIN PROCESS SOLUTIONS A MANPOWER",       "TALENTBRIDGE STAFFING SOLUTIONS"),
    ("Tapfin/Comsys",                             "TalentBridge Staffing"),

    ("Zones",                                     "NetworkZone Distribution"),

    ("SENNECA DIAGNOSTICS LLC",                   "HEALTHCHECK DIAGNOSTICS LLC"),

    ("Allied Universal (G4S)",                    "United Guard Services"),

    ("Multiply Technology",                       "MultiTech Solutions"),

    ("CompuCom Systems, Inc",                     "SystemsPro Inc"),
    ("CompuCom",                                  "SystemsPro"),

    ("Tes-Amm",                                   "ReNewIT Solutions"),

    ("DMD Systems Recovery, Inc.",                "DataRecovery Systems Inc"),

    ("HEWLETT PACKARD",                           "INFRATECH SYSTEMS"),
    ("Hewlett Packard Enterprise",                "InfraTech Systems"),
    ("HPE",                                       "InfraTech Systems"),

    ("DELL EMC",                                  "DataVault Technologies"),
    ("Dell EMC",                                  "DataVault Technologies"),
    ("DELL",                                      "DataVault Technologies"),
    ("Dell",                                      "DataVault Technologies"),

    ("Kaiser Permanente",                         "HealthBridge Partners"),

    ("Metlife",                                   "AssuranceFirst Life"),
    ("MetLife",                                   "AssuranceFirst Life"),

    ("United Healthcare",                         "PrimeHealth Insurance"),
    ("UHC UNITEDHEALTHCARE",                      "PRIMEHEALTH INSURANCE"),

    ("Aetna",                                     "VitalCare Health"),
    ("AETNA HEALTHCARE",                          "VITALCARE HEALTH"),

    ("AT&T",                                      "NationalComm Inc"),

    ("Verizon",                                   "ConnectOne Telecom"),

    ("FEDERAL EXPRESS CORP",                      "RAPIDSHIP LOGISTICS CORP"),
    ("FEDERAL EXPRESS",                           "RapidShip Logistics"),
    ("FedEx",                                     "RapidShip Logistics"),

    ("QUALITY BUILDING SERVICES",                 "CLEANWORKS SERVICES"),
    ("BRIGHTWORKS SUSTAINABILITY LLC",            "ECOWORKS SUSTAINABILITY LLC"),

    ("Betterup Inc",                              "GrowthPath Inc"),
    ("Betterup",                                  "GrowthPath"),

    ("Dr Sasse GMBH",                             "CleanPro GmbH"),

    ("COMPASS",                                   "CafeFirst Services"),

    ("Grand United Health",                       "Alliance Health Partners"),
    ("GU Health",                                 "Alliance Health Partners"),

    ("CSC Wesco",                                 "DataCable Supply Corp"),
    ("Anixter",                                   "NetworkCable Solutions"),

    ("Digital Realty Trust LP",                   "CoreData Centers LP"),
]

# ── SPECIFIC FINANCIAL / CONTRACT REFERENCES ─────────────────────────────────
FINANCIALS = [
    # IRQ-specific contract/SOW references and specific amounts — replace with generics
    (r'SOW 00252914',              'SOW-GEN-0042'),
    (r'\$22M projected pipeline',  '$18M projected pipeline'),
    (r'\$1M\+ prepayment',         '$500K+ prepayment'),
    (r'12,000-attendee',           '8,000-attendee'),
    (r'\$18M\+ consolidated spend','$15M+ consolidated spend'),
    (r'Reliance Matrix',           'Compliance Matrix'),
    (r'Club Events',               'Corporate Events'),
    (r'AMER and EMEA',             'Americas and EMEA'),
]

# ── APPLY REPLACEMENTS ────────────────────────────────────────────────────────
for old, new in PEOPLE:
    html = html.replace(old, new)
    print(f"  people: {old!r} → {new!r}")

for old, new in COMPANIES:
    html = html.replace(old, new)
    print(f"  company: {old!r} → {new!r}")

for pattern, new in FINANCIALS:
    html, n = re.subn(pattern, new, html)
    if n: print(f"  financial: {pattern!r} → {new!r} ({n}x)")

with open(SRC, "w", encoding="utf-8") as f:
    f.write(html)

print(f"\n✅ Sanitization complete. File saved to {SRC}")
print(f"   Backup at {BAK}")
