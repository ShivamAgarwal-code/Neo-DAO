# Make the audio sprites for the Neoland app using the "audiosprite" npm package
#   that should have been be globally installed via NPM or YARN.
#   The output files will go in the directory specified by the "--output" option.
#
#
# --path <path name> | The path where Howler can find the generated files
#     at run-time in the DEPLOYMENT file layout (See the "urls" field sprite JSON file
#     to understand what this means.
# --output <output file name> | The primary file name for the generated files.
# -f Howler | Howler format
# -e mp3 | Only generate MP3 file formats.  Do not generate OGG, WAVE, VORBIS, etc.
# [file list] | The list of files to pack into an audio sprite file.
cd .\output\audiosprites
audiosprite -l debug \
  \-\-path "\Users\rober\Documents\GitHub\ME\dolby\dolby-classroom-express\output\audiosprites" \
  \-\-output neoland-audiosprites \
  \-f howler \
  \-e mp3 \
  joanna-intro.mp3 \
  joanna-cards-intro-alt-1.mp3 \
  brian-yes-i-am.mp3 \
  joanna-first-pick.mp3 \
  brian-first-pick.mp3 \
  joanna-second-pick.mp3 \
  brian-second-pick.mp3 \
  joanna-pick-two-at-once.mp3 \
  brian-picks-two.mp3 \
  joanna-cards-matched.mp3 \
  joanna-echo-show-tap-instructions.mp3 \
  joanna-goodbye.mp3 \
  brian-you-are-welcome-joanna.mp3
cd -
echo "Done."