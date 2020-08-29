## \*3D\* Conway's Game of Life

After building a [2D Conway's Game of Life](https://github.com/sjoseph520/conways_game_of_life), I wondered what a 3D version would look like... so I built [this](https://sjoseph7-3d-conways-game-of-life.netlify.app/). Just like in the 2D version, the cells are color-coded based on the group they are part of and how large that group is - small groups are very green, large groups are very red.

The board is a 7x7x7 grid (mostly because that's the most my laptop could handle 😅). The original Conway's Game of Life rules don't work as well in 3D space, so after some experimentation I made my own that generate interesting visualizations (that don't immediately collapse) in a 7x7x7 grid.

3D Rules:

- If cell is alive and has `fewer than 7 neighbors` or `more than 9 neighbors`, it lives; otherwise it dies.
- If a cell is dead but has `exactly 4 or 10 neighbors`, it is 'revived'; otherwise, it stays dead.
