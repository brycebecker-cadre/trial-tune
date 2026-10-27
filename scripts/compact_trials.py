import json, re
d = json.load(open('ctgov/phase3.json'))
out = []
for s in d['studies']:
    p = s['protocolSection']; g = lambda m, k, dflt=None: p.get(m, {}).get(k, dflt)
    elig = g('eligibilityModule', 'eligibilityCriteria', '') or ''
    elig = re.sub(r'\s+', ' ', elig)[:900]
    arms = [f"{a.get('label','')} ({a.get('type','')})" for a in g('armsInterventionsModule', 'armGroups', [])]
    outs = [f"{o.get('measure','')} @ {o.get('timeFrame','')}" for o in g('outcomesModule', 'primaryOutcomes', [])][:3]
    di = g('designModule', 'designInfo', {})
    out.append({
        'nct': g('identificationModule', 'nctId'),
        'title': g('identificationModule', 'briefTitle'),
        'sponsor': g('sponsorCollaboratorsModule', 'leadSponsor', {}).get('name'),
        'conditions': g('conditionsModule', 'conditions', [])[:4],
        'interventions': [i.get('name') for i in g('armsInterventionsModule', 'interventions', [])][:5],
        'enrollment': g('designModule', 'enrollmentInfo', {}).get('count'),
        'start': g('statusModule', 'startDateStruct', {}).get('date'),
        'primaryCompletion': g('statusModule', 'primaryCompletionDateStruct', {}).get('date'),
        'allocation': di.get('allocation'), 'masking': di.get('maskingInfo', {}).get('masking'), 'model': di.get('interventionModel'),
        'arms': arms[:6], 'primaryOutcomes': outs,
        'ages': f"{g('eligibilityModule','minimumAge','')}-{g('eligibilityModule','maximumAge','')}",
        'eligibility': elig,
    })
json.dump(out, open('ctgov/index.json', 'w'), separators=(',', ':'))
print(len(out), 'trials;', len(open('ctgov/index.json').read())//1024, 'KB')
landmarks = ['NCT03548935','NCT04184622','NCT03574597','NCT01720446','NCT02465515','NCT03987919','NCT04657003','NCT04255433','NCT02648204','NCT03811561']
have = {o['nct'] for o in out}; print('landmarks present:', [n for n in landmarks if n in have]); print('missing:', [n for n in landmarks if n not in have])
