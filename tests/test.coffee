assert = require 'assert'
should = require 'should'
Sinew = require '../index'
_ = require 'lodash'

(->

    describe 'Sinew', ()->
        describe '#_construct', ()->
            it 'should throw an error when filter is not a function', ()->
                assert.throws ()->
                    options = {filter: ''}
                    sinew = new Sinew(options)
                    return
                return

            it 'should throw an error when filter function does not return a boolean', ()->
                assert.throws ()->
                    options = {
                        filter: ()->
                            return ''
                    }
                    sinew = new Sinew(options)
                    return
                return
            return

        describe '#create', ()->
            it 'should privatize underscore-prefixed functions', ()->
                sinew = new Sinew()
                TestObject = ()->
                    self = @
                    self._hidden = ()->
                    self.visible = ()->
                    self._setup = ()->
                        return sinew.setup self, TestObject
                    return self._setup()
                t = new TestObject()
                t.should.have.key('visible')
                t.should.not.have.keys('_hidden', '_setup')
                return

            it 'should privatize functions with a custom filter', ()->
                sinew = new Sinew({
                    filter: (x)->
                        return (x.indexOf('private') is -1)
                })
                TestObject = ()->
                    self = @
                    self._hidden = ()->
                    self.privateThing = ()->
                    self.visible = ()->
                    self.privateSetup = ()->
                        return sinew.setup self, TestObject
                    return self.privateSetup()
                t = new TestObject()
                t.should.have.key 'visible', '_hidden'
                t.should.not.have.keys 'privateThing', 'privateSetup'
                return
            return

        describe '#makeNew', ()->
            it 'should enforce the `new` keyword', ()->
                sinew = new Sinew()
                TestObject = ()->
                    self = sinew.makeNew @, TestObject
                    self.test = ()->
                    return self
                t = TestObject()
                t.should.be.an.instanceOf(TestObject)
                return
            return

        describe '#pawn', ()->
            if typeof module isnt 'undefined'
                it "shouldn't run in module context", ()->
                    context = {
                        prior: {
                            property: true
                            name: 'pr10rc0n73x7'
                        }
                    }
                    sinew = new Sinew()
                    TestObject = ()->
                        self = sinew.makeNew @, TestObject
                        self._hidden = ()->
                        self.visible = ()->
                        self._setup = ()->
                            return sinew.setup self, TestObject
                        return self._setup()
                    t = TestObject()
                    success = sinew.pawn('prior', t, context)
                    success.should.be.false
                    return

                it "shouldn't run in module context, unless explicitly enabled", ()->
                    context = {
                        prior: {
                            property: true
                            name: 'pr10rc0n73x7'
                        }
                    }
                    sinew = new Sinew({
                        pawnClientOnly: false
                    })
                    TestObject = ()->
                        self = sinew.makeNew @, TestObject
                        self.name = "n3wc0n73x7"
                        self._hidden = ()->
                        self.visible = ()->
                        self._setup = ()->
                            return sinew.setup self, TestObject
                        return self._setup()
                    t = TestObject()
                    success = sinew.pawn('prior', t, context)
                    success.should.not.be.false
                    context.prior.should.equal(t)
                    return

                it "should create a noConflict method on the pawned object", ()->
                    context = {
                        prior: {
                            property: true
                            name: 'pr10rc0n73x7'
                        }
                    }
                    sinew = new Sinew({
                        pawnClientOnly: false
                    })
                    TestObject = ()->
                        self = sinew.makeNew @, TestObject
                        self.name = "n3wc0n73x7"
                        self._hidden = ()->
                        self.visible = ()->
                        self._setup = ()->
                            return sinew.setup self, TestObject
                        return self._setup()
                    t = TestObject()
                    success = sinew.pawn('prior', t, context)
                    success.should.not.be.false
                    context.prior.should.equal(t)
                    context.prior.should.have.keys('name', 'visible', 'noConflict')
                    return

                it "should restore prior context when the noConflict method is called", ()->
                    context = {
                        prior: {
                            property: true
                            name: 'pr10rc0n73x7'
                        }
                    }
                    clone = _.extend {}, context
                    sinew = new Sinew({
                        pawnClientOnly: false
                    })
                    TestObject = ()->
                        self = sinew.makeNew @, TestObject
                        self.name = "n3wc0n73x7"
                        self._hidden = ()->
                        self.visible = ()->
                        self._setup = ()->
                            return sinew.setup self, TestObject
                        return self._setup()
                    t = TestObject()
                    success = sinew.pawn('prior', t, context)
                    success.should.not.be.false
                    context.prior.should.equal(t)
                    noconf = context.prior.noConflict()
                    noconf.should.not.have.key('noConflict')
                    context.prior.name.should.equal(clone.prior.name)
                    return
            return
)()