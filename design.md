rust axum backend, typescript vite react frontend, typeshare bash command to generate `types.ts` from `types.rs`

this is a people-matching app, we won't commit to a name right now. what is the problem of matching? it's that each person has their desired preferences, and their qualities -- i.e the things they want and the things they have. the problem of matching is to produce the optimal pairings -- i.e the set of pairings that maximize average fit

the typical way this is done is through *profiles*. there is some "template" which holds information, along with some function that takes two profiles and produces a fit score. the implementation of this function doesn't matter, only that it exists. each person takes their internal model of who they are and *compresses* it such that it fits in this profile. this however, has two central problems:
1. no one knows what everyone else wants. this is a problem because profiles are *extremely* lossy -- there is an immense amount of information constituting you, and you have to pick and choose what to highlight, based only on what you *believe* others want
2. determining profile match scores is highly nontrivial. we presented as "doesn't matter", but it's the whole thing! the central thing here is that we're trying to somehow model the extremely nuanced and complicated model of a person's preferences that they themself have

understanding these two problems reveals their solutions:
1. don't figure out how to design the best profile template -- it's impossible. figure out how to make preference *communication* possible
2. don't figure out how to automate matching, how to create a model that matches best -- use the model that already exists, namely the human being in the first place

this uniquely determines the structure of a new system:
- a profile consists of a set of question-answer pairs. there can be some "starter questions" built-in to bootstrap
- people scroll through profiles, reading the existing set of question-answer pairs. if the profile interests but they're not sure yet, they can send the person another question to answer. if they're not interested, they can skip the person. if they're interested and are sure, they can match with the person
- every time a person answers a question or changes the answer to a question, their profile is "refreshed", i.e everyone who has already viewed the profile (sent a question or skipped) can see the person again in their feed
- there is a question feed which shows the questions directed at you. for each question, you can either decline to answer or you can answer. declining to answer does not refresh your profile, answering does
- in the profile feed, the profiles who have marked match with you are at the top of the queue. matching with that person could do some stuff like give contact info or set up a date or whatever, we'll figure that out later

thus, what this app does it memoize and parallelize the normal human process of matching (face-to-face serial conversations) rather than automate anything