var sortIndex = 0;
var sortDirection = 1;
var ranks, actualRanks, aRanks, colley, wins, losses, actualQuality, matchups, colleyRanks, sos;
var numTeams, numGames;
var teamsBeaten, teamsLostTo;
var columnHeaders = {
    0: 'colleyRankHeader',
    1: 'actualRankHeader',
    2: 'colleyRatingHeader',
    3: 'winsHeader',
    4: 'lossesHeader',
    7: 'sosHeader'
};

function runSimulation() {
    //iteration variables
    var i, j;

    //temporary variable
    var tmp;

    //tolerance for continuation of update of Colley rankings
    var TOL = 0.0001;

    //get number of teams
    numTeams = document.getElementById('numTeams').value;

    //get number of games
    numGames = document.getElementById('numGames').value;

    //initialize rankings
    actualQuality = [];
    var numLeftToPlay = [];
    for (i = 0; i < numTeams; i++) {
        actualQuality.push(Math.random());
        numLeftToPlay.push(numGames);
    }

    //initialize matchups
    matchups = [];
    for (i = 0; i < numTeams; i++) {
        matchups[i] = [];
        for (j = 0; j < numTeams; j++)
            matchups[i][j] = 0;
    }

    //assign schedule
    var it=0;
    var numPlayed=0;
    var maxIterations = 1000000;
    while (numPlayed < numTeams * numGames && it < maxIterations) {
        it++;
        var team1 = Math.floor(Math.random() * numTeams);
        //make sure team1 still has at least one game left to play
        while(numLeftToPlay[team1] == 0)
            team1 = Math.floor(Math.random()*numTeams);

        var team2 = Math.floor(Math.random()*numTeams);
        var it2=0;
        var flag=false;
        while (numLeftToPlay[team2] == 0 || team1 == team2 || matchups[team1][team2] > 0) {
            team2 = Math.floor(Math.random() * numTeams);
            if(it2++ > maxIterations){
                //can get here if only teams left with a game to assign have already played each other
                flag = true;
                break;
            }
        }
        if(flag)
            break;

//        if (actualQuality[team1] < actualQuality[team2]) {
//            teamsLostTo[team1].push(team2);
//            teamsBeaten[team2].push(team1);
//        }
//        else {
//            teamsLostTo[team2].push(team1);
//            teamsBeaten[team1].push(team2);
//        }
        matchups[team1][team2]++;
        matchups[team2][team1]++;
        numLeftToPlay[team1]--;
        numLeftToPlay[team2]--;
        numPlayed=numPlayed+2;
    }

    //calculate wins and losses for each team.  Key assumption is that a team with a higher actualQuality will
    //always beat a team with a lower actualQuality
    wins = [];
    losses = [];
    for(i=0; i<numTeams; i++){
        wins[i] = 0;
        losses[i] = 0;
    }
    for(i=0; i<numTeams; i++)
        for(j=i+1; j<numTeams; j++)
            if (matchups[i][j]) {
                if (actualQuality[i] > actualQuality[j]) {
                    wins[i] += 1;
                    losses[j] += 1;
                }
                else {
                    wins[j] += 1;
                    losses[i] += 1;
                }
            }

    //calculate Colley ratings for each team

    //initialize ratings
    colley = [];
    for(i=0; i<numTeams; i++)
        colley[i] = (1.0+wins[i])/(2.0+wins[i]+losses[i]);

    //run a loop to iteratively update rankings
    var again = true;
    while(again){
        again = false;
        var numEffWins = [];
        for(i=0; i<numTeams; i++){
            numEffWins[i] = (wins[i]-losses[i])/2.0;
            for(j=0; j<numTeams; j++)
                numEffWins[i] += matchups[i][j]*colley[j];
        }
        for(i=0; i<numTeams; i++){
            var newColley = (1.0+numEffWins[i])/(2.0+wins[i]+losses[i]);
            if(newColley-colley[i] > TOL || newColley-colley[i] < -TOL)
                again = true;
            colley[i] = newColley;
        }
    }

    var cRanks = [];
    colleyRanks = [];
    for(i=0; i<numTeams; i++)
        cRanks[i] = i;
    for(i=0; i<numTeams; i++)
        for(j=i+1; j<numTeams; j++)
            if(colley[cRanks[j]] > colley[cRanks[i]]){
                tmp = cRanks[i];
                cRanks[i] = cRanks[j];
                cRanks[j] = tmp;
            }
    for (i = 0; i < numTeams; i++)
        colleyRanks[cRanks[i]] = i;

    //create arrays for teamsBeaten and teamsLostTo
    teamsBeaten = [];
    teamsLostTo = [];
    for (i = 0; i < numTeams; i++) {
        teamsBeaten[i] = [];
        teamsLostTo[i] = [];
    }
    for (i = 0; i < numTeams; i++)
        for (j = i + 1; j < numTeams; j++)
            if (matchups[i][j] > 0) {
                if (colleyRanks[i] > colleyRanks[j]) {
                    teamsBeaten[j].push(colleyRanks[i]+1);
                    teamsLostTo[i].push(colleyRanks[j]+1);
                } else {
                    teamsBeaten[i].push(colleyRanks[j]+1);
                    teamsLostTo[j].push(colleyRanks[i]+1);
                }

            }

    actualRanks = [];
    for(i=0; i<numTeams; i++)
        actualRanks[i] = i;
    for(i=0; i<numTeams; i++)
        for(j=i+1; j<numTeams; j++)
            if(actualQuality[actualRanks[j]] > actualQuality[actualRanks[i]]){
                tmp = actualRanks[i];
                actualRanks[i] = actualRanks[j];
                actualRanks[j] = tmp;
            }
    aRanks = [];
    for(i=0; i<numTeams; i++)
        aRanks[actualRanks[i]] = i;

    sos = [];
    for (i = 0; i < numTeams; i++) {
        sos[i] = 0;
        for (j = 0; j < numTeams; j++)
            if (matchups[i][j])
                sos[i] += colley[j];
        sos[i] = sos[i] / (wins[i] + losses[i]);
    }

    createTable();
}

function createTable() {
    var i;
    var sortOrder = [];
    for (i = 0; i < numTeams; i++)
        sortOrder[i] = i;

    function sortTable(order, value) {
        //order is an array that will hold the permutation that sorts the values in the array value
        for (i = 0; i < numTeams; i++)
            for (j = i + 1; j < numTeams; j++)
                if ((value[order[j]] - value[order[i]]) * sortDirection > 0) {
                    tmp = order[i];
                    order[i] = order[j];
                    order[j] = tmp;
                }
    };
    //sort the table
    switch (sortIndex) {
        case '1': sortTable(sortOrder, aRanks);
            break;
        case '2': sortTable(sortOrder, colley);
            break;
        case '3': sortTable(sortOrder, wins);
            break;
        case '4': sortTable(sortOrder, losses);
            break;
        case '7': sortTable(sortOrder, sos);
            break;
        default: sortTable(sortOrder, colleyRanks);
            break;
    }
                    
    var table = document.getElementById('rankingsTable');
    tmp = table.rows.length;
    for(i=0; i<tmp-1; i++)
        table.deleteRow(-1);
    for (i = 0; i < numTeams; i++) {

        var row = table.insertRow(i + 1);
        if (colleyRanks[sortOrder[i]] > aRanks[sortOrder[i]])
            row.className += ' underRated';
        if (colleyRanks[sortOrder[i]] < aRanks[sortOrder[i]])
            row.className += ' overRated';
        var cell = row.insertCell(0);
        cell.innerHTML = colleyRanks[sortOrder[i]]+1;
        cell = row.insertCell(1);
        cell.innerHTML = aRanks[sortOrder[i]]+1;
        cell = row.insertCell(2);
        cell.innerHTML = colley[sortOrder[i]];
        cell = row.insertCell(3);
        cell.innerHTML = wins[sortOrder[i]];
        cell = row.insertCell(4);
        cell.innerHTML = losses[sortOrder[i]];
        cell = row.insertCell(5);
//        for(j=0; j<numTeams; j++)
        //            if (matchups[sortOrder[i]][sortOrder[j]] > 0 && actualQuality[sortOrder[i]] > actualQuality[sortOrder[j]])
        for (j = 0; j < teamsBeaten[sortOrder[i]].length; j++)
            cell.innerHTML += teamsBeaten[sortOrder[i]][j] + ',';
        cell = row.insertCell(6);
//        for (j = 0; j < numTeams; j++)
//            if (matchups[sortOrder[i]][sortOrder[j]] > 0 && actualQuality[sortOrder[i]] < actualQuality[sortOrder[j]])
//                cell.innerHTML += (colleyRanks[sortOrder[j]] + 1) + ',';
        for (j = 0; j < teamsLostTo[sortOrder[i]].length; j++)
            cell.innerHTML += teamsLostTo[sortOrder[i]][j] + ',';
        cell = row.insertCell(7);
        cell.innerHTML = sos[sortOrder[i]];
    }
}


window.onload = function () {
    document.getElementById('runSim').onclick = runSimulation;

    var setSort = function (index) {
        return function () {
            if (sortIndex === index)
                sortDirection = -1 * sortDirection;
            else {
                console.log('got here');
                sortIndex = index;
                sortDirection = -1;
            }
            createTable();
        };
    };

    for (var item in columnHeaders) {
        console.log('got an item with key: ' + item + ' and value: ' + columnHeaders[item]);
        document.getElementById(columnHeaders[item]).onclick = setSort(item);
    }
}