describe("Positions", function(){
  var positionArgs, position;

  //setup
  positionArgs = {currentSeconds: 0.0,
                  startSeconds: 0.0,
                  stopSeconds: 0.0,
                  timelineStartSeconds: 0.0
                 };

  validPositionDefaults = {
      mediaBeginning: 0.0,
      startSeconds: 0.0,
      stopSeconds: 0.0,
      currentSeconds: 0.0,
      timelineStartSeconds: 0.0,
      calculatedTCT: 0.0,
      getMediaDuration: 0.0
  };

  beforeEach(function(){
    position = new Positions(positionArgs);
  });  

  it("should have a toString function", function(){
    expect(position.toString()).toEqual(jasmine.any(String));
  });

  it("should return the duration", function(){
    expect(position.getMediaDuration(0)).toEqual(0);
  });

  describe("bound helper", function(){
    it("shouldn't ever return a value less than lower", function(){
      expect(position.boundWithin(1,2,3)).toEqual(2);
      expect(position.boundWithin(-1.0,2,3)).toEqual(2);
      expect(position.boundWithin(0,2,3)).toEqual(2);
    });

    it("shouldn't ever return a number more than upper", function(){
      expect(position.boundWithin(4,2,3)).toEqual(3);
      expect(position.boundWithin(4.4,2,3.5)).toEqual(3.5);
    });

    it("should return the given input if within the bounds", function(){
      expect(position.boundWithin(1,0,3)).toEqual(1);
      expect(position.boundWithin(1,-14,3)).toEqual(1);
      expect(position.boundWithin(-1.0,-14,3)).toEqual(-1);
      expect(position.boundWithin(5.5,2.5,10)).toEqual(5.5);
    });

    //no exceptions or defined behavior if values are NAN or upper is lower than lower.
  });

  describe("updateValues", function(){
    beforeEach(function(){
      position = new Positions();
    });

    it("should have valid defaults", function(){
      expect(position.updateValues()).toEqual(validPositionDefaults);
    });

    it("should update those values passed in", function(){
      expect(position.updateValues({startSeconds: 4.1}).startSeconds).toEqual(4.1);
      expect(position.updateValues().getMediaDuration).toEqual(-4.1);
      expect(position.updateValues({stopSeconds: 4.1}).stopSeconds).toEqual(4.1);
      expect(position.updateValues().getMediaDuration).toEqual(0);
      expect(position.updateValues({timelineStartSeconds: 4.1}).timelineStartSeconds).toEqual(4.1);
      expect(position.updateValues({timelineStartSeconds: 0.0}).timelineStartSeconds).toEqual(0.0);
      expect(position.updateValues({currentSeconds: 4.1}).currentSeconds).toEqual(4.1);

      position.updateValues({startSeconds: 0.0});
      expect(position.updateValues().getMediaDuration).toEqual(4.1);

    });
    
    it("should calculate mediaDuration by startSeconds and stopSeconds values", function(){
      position.updateValues({startSeconds: 1.1, stopSeconds: 10})
      expect(position.getValues().getMediaDuration).toEqual(8.9);
    });

  });

  describe("getValues()", function(){
    it("should get recently updated values", function(){
      expect(position.getValues().currentSeconds).toEqual(0);
      expect(position.updateMCT(5, true)).toEqual(position.getValues().currentSeconds);
    });
  });

  
  describe("calculate media values based on current position", function(){
    beforeEach(function(){
      position = new Positions(positionArgs);
    });  

    it("should return the calculated MCT from given TCT when timelineStartSeconds is zero", function(){
      position.updateValues({startSeconds: 3,
                             stopSeconds: 10,
                             timelineStartSeconds: 0.0});
      expect(position.calculateMCT(0)).toEqual(3);
      expect(position.calculateMCT(3)).toEqual(6);
      expect(position.calculateMCT(3.5)).toEqual(6.5);
      expect(position.getValues().currentSeconds).toEqual(0);
      expect(position.updateMCT(3.5));
      expect(position.getValues().currentSeconds).toEqual(6.5);
      expect(position.calculateMCT()).toEqual(6.5);
    });

    it("should return the calculated MCT from given TCT when timelineStartSeconds is not zero", function(){
      position.updateValues({startSeconds: 3,
                             stopSeconds: 10,
                             timelineStartSeconds: 3.0});
      expect(position.calculateMCT(0)).toEqual(0);
      expect(position.calculateMCT(3)).toEqual(3);
      expect(position.calculateMCT(3.5)).toEqual(3.5);
      expect(position.getValues().currentSeconds).toEqual(0);
      expect(position.updateMCT(3.5));
      expect(position.getValues().currentSeconds).toEqual(3.5);
      expect(position.calculateMCT()).toEqual(3.5);

      position.updateValues({startSeconds: 3,
                             stopSeconds: 13,
                             timelineStartSeconds: 10.0});
      expect(position.calculateMCT(0)).toEqual(-7);
      expect(position.calculateMCT(5)).toEqual(-2);
      expect(position.calculateMCT(7)).toEqual(0);
      expect(position.calculateMCT(10)).toEqual(3);
      expect(position.calculateMCT(20)).toEqual(13);
      expect(position.calculateMCT(22)).toEqual(15);
    });

    it("should return timelineCurrentTime from currentSeconds and can be past media's set ranges", function(){
      position.updateValues({startSeconds: 3,
                             stopSeconds: 10,
                             timelineStartSeconds: 0.0});
      expect(position.updateMCT(0)).toEqual(3);
      expect(position.calculateMCT(20)).toEqual(23);
    });

  });

  describe("calculate timeline values based on media current position", function(){
    beforeEach(function(){
      position = new Positions(positionArgs);
    });  

    it("should calculateTCT properly when timelineStartSeconds is greater than zero", function(){
      position.updateValues({timelineStartSeconds: 1.0});
      expect(position.calculateTCT(5)).toEqual(6);

      expect(position.calculateTCT(10)).toEqual(11);
    });

    it("should calculateTCT properly when timelineStartSeconds is greater than zero and other values aren't zero", function(){
      position.updateValues({startSeconds: 3,
                             stopSeconds: 10,
                             timelineStartSeconds: 5.0
                             });
      expect(position.getValues().currentSeconds).toEqual(0);
      expect(position.calculateTCT(3)).toEqual(5);
      expect(position.calculateTCT(5)).toEqual(7);
      expect(position.calculateTCT(10)).toEqual(12);
      expect(position.calculateTCT(20)).toEqual(22);
    });

    it("should allow calculateTCT to be called without changing state", function(){
      expect(position.calculateTCT()).toEqual(0);
      expect(position.calculateTCT(1)).toEqual(1);
      expect(position.calculateTCT()).toEqual(0);
    });

    it("should return negative values in TCT if media currentSeconds is negative", function(){
      position.updateValues({"startSeconds": 0,
                             "stopSeconds": 5,
                             "timelineStartSeconds": 2,
                             "currentSeconds": -10
                            });
      expect(position.calculateTCT()).toEqual(-8);
    });
  });

  describe("isMediaToPlay", function(){
    it("should return true if a video's start and stop is between the media current time calculated from the tct", function(){
      position.updateValues({startSeconds: 0,
                             stopSeconds: 10,
                             timelineStartSeconds: 0});
      expect(position.isMediaToPlay(0)).toEqual(true);
    });

    it("should not return true when the start time of a video is after the media ct calcualted from the given tct", function(){
      position.updateValues({startSeconds: 4,
                             stopSeconds: 10,
                             timelineStartSeconds: 20});
      expect(position.isMediaToPlay(5)).toEqual(false);
    });

    it("should return true when position is within media playable", function(){
      position.updateValues({startSeconds: 4,
                             stopSeconds: 10,
                             timelineStartSeconds: 6});
      expect(position.isMediaToPlay(7)).toEqual(true);
    });
  });
})
