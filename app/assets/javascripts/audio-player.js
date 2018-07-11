import Vue from 'vue';

const LocalStorageHelper= require('./local-storage-helper').default



import {Howl, Howler} from 'howler';

  //goes by hash
var preloadedSoundMap = {};

//var channelHowls = {};
var activeHowls = {};  //clear this out on a full stop
var allHowls = {}; //clear this out on a full stop

var audioIdCounter = 0;




  var analyzer;
  var waveRenderer

export default class AudioPlayer {
  constructor( ){

  }

  init()
  {


/*
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var analyser = Howler.ctx.createAnalyser();
    //analyser.connect(ctx.destination);
    analyser.fftSize = 2048;

*/

  }

  setWaveRenderer(renderer)
  {
      //var ctx = new (window.AudioContext || window.webkitAudioContext)();
      //var analyser = ctx.createAnalyser();

      waveRenderer = renderer;
  }

  async preloadSounds()
  {
    console.log('preload')
  }

  //https://medium.com/@SrvZ/build-a-audio-player-in-electron-e1b133776c6

   playSound(sfx)
  {

    if(!sfx.preloaded)
    {
    //  var response = await socketClient.emit('queueSound',sfx);
    //  console.log('got ',response)
      return;
    }

     var howlId = audioIdCounter++;

     var effectSpeed = 1.0;

     if(sfx.attributes.speed.enabled)
     {
       effectSpeed = (sfx.attributes.speed.value / 100.0)
     }


     var effectVolume = 1.0;

     if(sfx.attributes.volume.enabled)
     {
       effectVolume = (sfx.attributes.volume.value / 100.0)
     }

     console.log(effectVolume)






    var current_hostname = window.location.hostname;

    const socketServer = 'http://'+current_hostname+':3000/audio';
    var socketsPath ;


    var socketsPath =  socketServer+'/'+sfx.sfxHash+'.wav'
      // Setup the new Howl.
      var audio = new Howl({
          src: socketsPath,
          html5: true,
          preload: false,
          volume: effectVolume,
          rate: effectSpeed,
          onend: function() {
            activeHowls[howlId] = null;
          }
        })


      var play = audio.play()

      if(waveRenderer)   waveRenderer.start();

      allHowls[howlId] = {sfx: sfx, howl: audio, play: play};
      activeHowls[howlId] = {sfx: sfx, howl: audio , play: play };


      if(sfx.attributes.fadeIn.enabled)
      {
        audio.fade(0, 1, 400, play);
      }else if (sfx.attributes.fadeOut.enabled) {
        audio.fade(1, 0, 400, play);
      }

      return {success:true, sfx:sfx}



  }



  stopActivePlayback(preservedHash,channel)
  {
    //if channel is null then all channels

    for(var howlId in allHowls)
    {
      var resource = allHowls[howlId];

      console.log('active howls ', resource )

      if(resource && resource.howl
      && (preservedHash==null || preservedHash != resource.sfx.sfxHash))
      {
        resource.howl.stop()
        allHowls[howlId] = null;
      }

    }

    //if no channel..
     activeHowls = {};
     allHowls = {};
  }


  /*


  //stream   https://github.com/goldfire/howler.js/issues/378
  var stream = new Howl({
    src: ['...'],
    ext: ['mp3'],
    autoplay: true,
    html5: true
});



  */


}
