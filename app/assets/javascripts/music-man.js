import Vue from 'vue';

const LocalStorageHelper= require('./local-storage-helper').default



var sfxEventQueue = [];
var eventsDelayedUntilBeat = [];

export default class MusicMan {
  constructor(audioPlayer){
    this.audioPlayer=audioPlayer;

  }

  init( )
  {

  }

  setMetronomeComponent(metronomeComponent)
  {
    this.metronomeComponent = metronomeComponent;
  }


  async queueSFXEvent(sfx)
  {



    var immediatePlay = true;
    var queue = false;

    if(sfx == null){
      console.error('cannot handle sfx',sfx);
      return;
    }

    if(sfx.attributes.waitForBeat.enabled || sfx.attributes.pulse.enabled)
    {
      immediatePlay = false;

        queue = true;


    }


    if(immediatePlay){

      this.handleAllSFXEvents(sfx,false)

      this.audioPlayer.playSound(sfx)
    }




    if(queue){

      //We don't want this to keep occuring !!
      this.handleAllSFXEvents(sfx,true)

      if(!this.sfxWithHashIsQueued(sfx.sfxHash))
      {
        this.addToQueue(sfx)
      }

    }


    return {success:true, sfx:sfx}
  }


  async handleAllSFXEvents(sfx,delayUntilBeat)
  {

    //We don't want this to keep occuring !!
    for(var key in  sfx.attributes)
    {
      var attr = sfx.attributes[key]
      if(attr.enabled)
      {
       await  this.handleSFXEvent(sfx, attr.name,delayUntilBeat)
      }
    }


  }

  async handleSFXEvent(sfx, eventName,delayUntilBeat)
  {

    if(delayUntilBeat)
    {
      eventsDelayedUntilBeat.push({sfx:sfx, eventName:eventName});
      return;
    }

    var sfxHash = sfx ? sfx.sfxHash : null;

    if(this.metronomeComponent)
    {
      await this.metronomeComponent.handleMetronomeEvent(sfx,eventName)
    }


    switch(eventName)
    {
      case 'cancelChannel': this.audioPlayer.stopActivePlayback(sfxHash,sfx.attributes.cancelChannel.value); break;
      case 'cancelAll': this.audioPlayer.stopActivePlayback(sfxHash); break;
      case 'cancelLoops': this.cancelQueuedLoops( );  break;
    }
  }

  cancelQueuedLoops()
  {
      for(var i in sfxEventQueue)
      {
        var sfxEvent = sfxEventQueue[i];
        var sfxEventActivated = (sfxEvent.properties) ? sfxEvent.properties.activated : null;


        if( sfxEventActivated )
        {
        //  sfxEventQueue = sfxEventQueue.splice(i,1);
          sfxEventQueue.splice(i,1);  //only remove this one event

            console.log('splicing', sfxEvent.sfx.sfxName)
        }else{
          console.log('Preserving', sfxEvent.sfx.sfxName)
        }
      }

  }

  // array.splice(i, 1);  remove specific element  at key i

  addToQueue(sfx)
  {
     sfxEventQueue.push({sfx:sfx,properties:{}})
  }

  //the metronome calls this method
  async beat(undershoot)
  {
    //music man learned of a new music beat :)
  //  console.log('queue', sfxEventQueue)
  console.log('event queue ', sfxEventQueue.length)


    //kill activated beats
    for(var i in eventsDelayedUntilBeat)
    {
      console.log('pop delayed event ', )
      var event = eventsDelayedUntilBeat.pop();
      await this.handleSFXEvent(event.sfx, event.eventName)
    }



    //flush sfx
    eachEvent:
    for(var i in sfxEventQueue)
    {
      var sfx = sfxEventQueue[i].sfx;
      var properties = sfxEventQueue[i].properties;

      if(sfx.attributes.waitForBeat.enabled || sfx.attributes.pulse.enabled)
      {


          if( isNaN(parseInt(properties.beatsWaited))
          || parseInt(properties.beatsWaited) >= parseInt(sfx.attributes.pulse.value))
          {
            properties.beatsWaited = 0;
          }

          console.log(properties.beatsWaited)

          if(sfx.attributes.pulse && sfx.attributes.pulse.value
            && (parseInt(properties.beatsWaited) < parseInt(sfx.attributes.pulse.value)) )
          {
              var beatsValue = properties.beatsWaited ;
              properties.beatsWaited = parseInt(properties.beatsWaited) + 1;

             if(parseInt(beatsValue)!=0) continue eachEvent;

          }






          //mark as activated, can be killed from a 'cancel loops' now
        sfxEventQueue[i].properties.activated = true;

        this.audioPlayer.playSound(sfx)
        if(sfx.attributes.waitForBeat.enabled)
        {
          sfxEventQueue.splice(i, 1); //remove it from the array
        }


      }


    }

  }


  sfxWithHashIsQueued(hash)
  {

    for(var i in sfxEventQueue)
    {
      var sfx = sfxEventQueue[i].sfx;

      if(sfx.attributes.waitForBeat || sfx.attributes.pulse)
      {
        if(sfx.sfxHash == hash)
        {
          return true;
        }
      }

    }
      return false;
  }


}
